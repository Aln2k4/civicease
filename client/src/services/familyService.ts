import api from "./api";

const create = async (data: any) => {
    return await api.post("/families", data);
};

const getAvailableCitizens = async () => {
    const response = await api.get("/families/available-citizens");
    return response.data;
};

const getAll = async (params?: any) => {
    const response = await api.get("/families", { params });
    return response.data;
};

const getById = async (id: string) => {
    const response = await api.get(`/families/${id}`);
    return response.data;
};

const getByCitizenId = async (citizenId: string) => {
    const response = await api.get(`/families/by-citizen/${citizenId}`);
    return response.data;
};

const addMember = async (familyId: string, citizenId: string, relationship: string) => {
    const response = await api.post(`/families/${familyId}/members`, { citizenId, relationship });
    return response.data;
};

const removeMember = async (familyId: string, memberId: string, reason: string, certificate: File) => {
    const formData = new FormData();
    formData.append("reason", reason);
    if (certificate) {
        formData.append("certificate", certificate);
    }

    // Changed to PUT as DELETE with body/files is not standard
    const response = await api.put(`/families/${familyId}/members/${memberId}/remove`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

const uploadCSV = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/families/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

const familyService = {
    create,
    getAvailableCitizens,
    getAll,
    getById,
    getByCitizenId,
    addMember,
    removeMember,
    uploadCSV,
};

export default familyService;
