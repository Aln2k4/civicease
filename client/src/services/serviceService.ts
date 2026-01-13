import api from './api';

const getAll = async () => {
    const response = await api.get('/services');
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
