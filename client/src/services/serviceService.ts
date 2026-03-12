import api from './api';

const getAll = async (params?: any) => {
    const response = await api.get('/services', { params });
    return response.data;
};

const create = async (data: any) => {
    const response = await api.post('/services', data);
    return response.data;
};

const verify = async (id: string, data?: any) => {
    const response = await api.put(`/services/${id}/verify`, data);
    return response.data;
};

const approve = async (id: string, data?: any) => {
    const response = await api.put(`/services/${id}/approve`, data);
    return response.data;
};

const reject = async (id: string, data: { reason: string }) => {
    const response = await api.put(`/services/${id}/reject`, data);
    return response.data;
};

const issue = async (id: string, data?: any) => {
    const response = await api.put(`/services/${id}/issue`, data);
    return response.data;
};

const serviceService = {
    getAll,
    create,
    verify,
    approve,
    reject,
    issue,
};

export default serviceService;
