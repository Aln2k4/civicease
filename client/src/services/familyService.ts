import api from './api';

const getAll = async () => {
    const response = await api.get('/families');
    return response.data;
};

const getById = async (id: string) => {
    const response = await api.get(`/families/${id}`);
    return response.data;
};

const create = async (data: any) => {
    const response = await api.post('/families', data);
    return response.data;
};

const addMember = async (familyId: string, citizenId: string, relationship?: string) => {
    const response = await api.post(`/families/${familyId}/members`, { citizenId, relationship });
    return response.data;
};

const removeMember = async (familyId: string, citizenId: string, reason: string) => {
    const response = await api.post(`/families/${familyId}/members/remove`, { citizenId, reason });
    return response.data;
};

const familyService = {
    getAll,
    getById,
    create,
    addMember,
    removeMember,
};

export default familyService;
