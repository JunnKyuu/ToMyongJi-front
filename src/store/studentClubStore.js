import { create } from 'zustand';
import { fetchAllClubs } from '../utils/receiptApi';
import { fetchClubMembers, addClubMember, deleteClubMember } from '../utils/studentClubMemberApi';

const useStudentClubStore = create((set, get) => ({
  clubs: [],
  currentClub: null,
  isLoading: false,
  error: null,
  fetchClubs: async () => {
    set({ isLoading: true });
    try {
      const clubs = await fetchAllClubs();
      set({ clubs, isLoading: false, error: null });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
  getClubNameById: (clubId) => {
    const club = get().clubs.find((club) => club.id === clubId);
    return club ? club.studentClubName : '알 수 없는 동아리';
  },
  setCurrentClub: (clubId) => {
    const club = get().clubs.find((club) => club.id === clubId);
    if (club) {
      set({ currentClub: club });
    } else {
      // 클럽을 찾지 못한 경우 클럽 정보를 다시 가져옵니다.
      get()
        .fetchClubs()
        .then(() => {
          const updatedClub = get().clubs.find((club) => club.id === clubId);
          if (updatedClub) {
            set({ currentClub: updatedClub });
          }
        });
    }
  },
  fetchClubMembers: async (clubId) => {
    set({ isLoading: true });
    try {
      const members = await fetchClubMembers(clubId);

      set((state) => ({
        currentClub: { ...state.currentClub, memberInfos: members },
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
  addMember: async (userId, memberData) => {
    set({ isLoading: true });
    try {
      const newMember = await addClubMember(userId, memberData);
      set((state) => ({
        currentClub: {
          ...state.currentClub,
          memberInfos: [...state.currentClub.memberInfos, newMember],
        },
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
  deleteMember: async (memberId) => {
    set({ isLoading: true });
    try {
      await deleteClubMember(memberId);

      set((state) => ({
        currentClub: {
          ...state.currentClub,
          memberInfos: state.currentClub.memberInfos.filter((member) => member.id !== memberId),
        },
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({ error, isLoading: false });
    }
  },
  verifyClubMembership: async (clubId, studentNum, name) => {
    set({ isLoading: true });
    try {
      // console.log(clubId);
      let club = get().clubs.find((club) => club.id === clubId);
      // console.log(club);
      if (!club) {
        await get().fetchClubs();
        club = get().clubs.find((club) => club.id === clubId);
      }

      if (!club) {
        throw new Error('클럽을 찾을 수 없습니다.');
      }

      await get().fetchClubMembers(clubId);
      const currentClub = get().currentClub;
      if (!currentClub || !currentClub.memberInfos) {
        throw new Error('클럽 멤버 정보를 가져올 수 없습니다.');
      }

      const member = currentClub.memberInfos.find((member) => member.studentNum === studentNum && member.name === name);

      set({ isLoading: false, error: null });
      return !!member;
    } catch (error) {
      set({ isLoading: false, error });
      throw error;
    }
  },
}));

useStudentClubStore.getState().fetchClubs();

export default useStudentClubStore;
