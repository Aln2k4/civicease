import api from './api';

const getAll = async (params?: any) => {
    const response = await api.get('/citizens', { params });
    return response.data;
};

const getById = async (id: string) => {
    const response = await api.get(`/citizens/${id}`);
    return response.data;
};

const create = async (data: any) => {
    const response = await api.post('/citizens', data);
    return response.data;
};

const update = async (id: string, data: any) => {
    const response = await api.put(`/citizens/${id}`, data);
    return response.data;
};

const uploadCSV = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/citizens/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const citizenService = {
    getAll,
    getById,
    create,
    update,
    uploadCSV,
};

export default citizenService;
