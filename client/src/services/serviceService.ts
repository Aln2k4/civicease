import api from './api';

const getAll = async (params?: any) => {
    const response = await api.get('/services', { params });
    return response.data;
};

const create = async (data: any) => {
    const response = await api.post('/services', data);
    return response.data;
};

const serviceService = {
    getAll,
    create,
};

export default serviceService;
