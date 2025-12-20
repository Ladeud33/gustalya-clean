// Mock Firebase for UI Prototypes
export const auth = {
  currentUser: { uid: '123' }
};

export const db = {};

export const collection = () => {};
export const addDoc = async () => ({ id: 'new-doc' });
export const getDocs = async () => ({ docs: [] });
export const query = () => {};
export const where = () => {};
export const deleteDoc = async () => {};
export const doc = () => {};
export const updateDoc = async () => {};
export const getDoc = async () => ({ exists: () => true, data: () => ({}) });
