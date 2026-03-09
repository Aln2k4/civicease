const generateVerificationChecklist = (serviceName, formData, citizenData) => {
    const checklist = [];

    // Core parameters for all certificates
    checklist.push({
        label: "Applicant Identity (Aadhaar/Ration)",
        expected: citizenData.uniqueId || citizenData.rationCardNumber || "Found Profile",
        provided: formData.uniqueId || formData.rationCardNumber || "Provided Request",
        status: (citizenData.uniqueId && formData.uniqueId && citizenData.uniqueId === formData.uniqueId) ? 'Verified' : (citizenData._id ? 'Verified' : 'Pending'),
        isCritical: true,
        type: 'identity'
    });

    checklist.push({
        label: "Date of Birth",
        expected: citizenData.dob ? new Date(citizenData.dob).toLocaleDateString('en-GB') : "N/A",
        provided: formData.dob ? new Date(formData.dob).toLocaleDateString('en-GB') : "N/A",
        status: compareDates(citizenData.dob, formData.dob) ? 'Verified' : 'Mismatch',
        isCritical: true,
        type: 'demographic'
    });

    // Dynamic checks based on certificate type
    if (serviceName === 'Income Certificate') {
        const familyIncome = citizenData.familyAnnualIncome || 0;
        const claimedIncome = formData.annualIncome || 0;

        checklist.push({
            label: "Expected Annual Income (Family)",
            expected: `₹${familyIncome}`,
            provided: `₹${claimedIncome}`,
            status: familyIncome > 0 && Math.abs(familyIncome - claimedIncome) <= 5000 ? 'Verified' : 'Mismatch',
            isCritical: true,
            type: 'financial'
        });

        checklist.push({
            label: "Occupation Status",
            expected: citizenData.occupation || "N/A",
            provided: formData.occupation || "N/A",
            status: citizenData.occupation === formData.occupation ? 'Verified' : 'Mismatch',
            isCritical: false,
            type: 'financial'
        });
    } else if (serviceName === 'Community Certificate' || serviceName === 'Caste Certificate') {
        checklist.push({
            label: "Religion",
            expected: citizenData.religion || "N/A",
            provided: formData.religion || "N/A",
            status: citizenData.religion?.toLowerCase() === formData.religion?.toLowerCase() ? 'Verified' : 'Mismatch',
            isCritical: true,
            type: 'community'
        });

        checklist.push({
            label: "Caste/Community",
            expected: citizenData.caste || "N/A",
            provided: formData.caste || "N/A",
            status: citizenData.caste?.toLowerCase() === formData.caste?.toLowerCase() ? 'Verified' : 'Mismatch',
            isCritical: true,
            type: 'community'
        });
    } else if (serviceName === 'Residence Certificate' || serviceName === 'Nativity Certificate') {
        checklist.push({
            label: "Residence Address (House)",
            expected: citizenData.houseName || citizenData.permanentAddress?.houseName || "N/A",
            provided: formData.houseName || "N/A",
            status: (citizenData.houseName?.toLowerCase() === formData.houseName?.toLowerCase()) ? 'Verified' : 'Mismatch',
            isCritical: true,
            type: 'residence'
        });

        checklist.push({
            label: "Ward",
            expected: citizenData.ward || "N/A",
            provided: formData.ward || "N/A",
            status: citizenData.ward === formData.ward ? 'Verified' : 'Mismatch',
            isCritical: true,
            type: 'residence'
        });
    }

    return checklist;
};

// Helper for fuzzy date matching (ignoring time)
const compareDates = (date1, date2) => {
    if (!date1 || !date2) return false;
    try {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    } catch (e) {
        return false;
    }
};

module.exports = {
    generateVerificationChecklist
};
