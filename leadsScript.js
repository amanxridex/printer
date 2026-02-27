document.addEventListener('DOMContentLoaded', () => {
    const leadsTableBody = document.getElementById('leadsTableBody');

    const mockLeads = [
        { name: "Rahul Sharma", email: "rahul.s@example.com", phone: "+91 98765 43210", requirement: "3 BHK Apartment", location: "Noida Extension", budget: "₹80L - ₹1.2Cr", aiScore: 92, status: "Hot", avatarColor: "#6366f1" },
        { name: "Priya Desai", email: "priya.d@example.com", phone: "+91 99887 76655", requirement: "Luxury Villa", location: "Gurugram Sec-65", budget: "₹3Cr - ₹5Cr", aiScore: 88, status: "Warm", avatarColor: "#10b981" },
        { name: "Amit Patel", email: "amit.p@example.com", phone: "+91 91234 56789", requirement: "Commercial Shop", location: "Vrindavan", budget: "₹40L - ₹60L", aiScore: 95, status: "Hot", avatarColor: "#f59e0b" },
        { name: "Sneha Reddy", email: "sneha.r@example.com", phone: "+91 88998 89988", requirement: "2 BHK Apartment", location: "Noida Sec-150", budget: "₹65L - ₹85L", aiScore: 74, status: "Cold", avatarColor: "#ec4899" },
        { name: "Vishal Singh", email: "vishal.s@example.com", phone: "+91 99001 10099", requirement: "Residential Plot", location: "Mathura Road", budget: "₹25L - ₹40L", aiScore: 85, status: "Warm", avatarColor: "#8b5cf6" },
        { name: "Anjali Gupta", email: "anjali.g@example.com", phone: "+91 77665 54433", requirement: "4 BHK Penthouse", location: "Gurugram Sec-42", budget: "₹5Cr+", aiScore: 98, status: "Hot", avatarColor: "#3b82f6" },
        { name: "Rohit Verma", email: "rohit.v@example.com", phone: "+91 88776 65544", requirement: "Studio Apartment", location: "Noida Extension", budget: "₹30L - ₹45L", aiScore: 65, status: "Cold", avatarColor: "#ef4444" },
        { name: "Neha Khanna", email: "neha.k@example.com", phone: "+91 99881 12233", requirement: "3 BHK Apartment", location: "Vrindavan", budget: "₹90L - ₹1.1Cr", aiScore: 89, status: "Warm", avatarColor: "#14b8a6" },
        { name: "Karan Johar", email: "karan.j@example.com", phone: "+91 77889 90011", requirement: "Commercial Office", location: "Gurugram Cyber City", budget: "₹10Cr+", aiScore: 91, status: "Hot", avatarColor: "#f43f5e" },
        { name: "Meera Bai", email: "meera.b@example.com", phone: "+91 98989 89898", requirement: "Villa", location: "Mathura", budget: "₹1.5Cr - ₹2.5Cr", aiScore: 82, status: "Warm", avatarColor: "#d946ef" }
    ];

    if (leadsTableBody) {
        let html = '';
        mockLeads.forEach(lead => {

            let statusBadge = '';
            if (lead.status === 'Hot') statusBadge = `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;"><i class="fas fa-fire"></i> Hot</span>`;
            else if (lead.status === 'Warm') statusBadge = `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;"><i class="fas fa-temperature-half"></i> Warm</span>`;
            else statusBadge = `<span style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;"><i class="fas fa-snowflake"></i> Cold</span>`;

            let aiScoreColor = lead.aiScore >= 90 ? 'var(--success)' : lead.aiScore >= 80 ? 'var(--primary)' : 'var(--warning)';

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s; cursor: pointer;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 1rem 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${lead.avatarColor}20; border: 1px solid ${lead.avatarColor}50; display: flex; align-items: center; justify-content: center; color: ${lead.avatarColor}; font-weight: bold; font-size: 1.1rem;">
                                ${lead.name.charAt(0)}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: white;">${lead.name}</div>
                                <div style="font-size: 0.8rem; color: var(--gray);">${lead.email}</div>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 1rem 0.5rem; color: #cbd5e1; font-size: 0.9rem;">
                        <i class="fas fa-phone-alt" style="font-size: 0.8rem; color: var(--gray); margin-right: 0.4rem;"></i> ${lead.phone}
                    </td>
                    <td style="padding: 1rem 0.5rem;">
                        <div style="color: white; font-weight: 500; font-size: 0.95rem;">${lead.requirement}</div>
                        <div style="font-size: 0.8rem; color: var(--gray);"><i class="fas fa-map-marker-alt"></i> ${lead.location}</div>
                    </td>
                    <td style="padding: 1rem 0.5rem; color: var(--primary); font-family: 'Space Grotesk', sans-serif; font-weight: 600;">
                        ${lead.budget}
                    </td>
                    <td style="padding: 1rem 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-robot" style="color: ${aiScoreColor}"></i>
                            <span style="font-weight: 700; color: white;">${lead.aiScore}</span><span style="color: var(--gray); font-size: 0.8rem;">/100</span>
                        </div>
                    </td>
                    <td style="padding: 1rem 0.5rem;">
                        ${statusBadge}
                    </td>
                    <td style="padding: 1rem 0.5rem; text-align: right;">
                        <button style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.4rem; border-radius: 6px; cursor: pointer; margin-right: 0.4rem; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-envelope"></i></button>
                        <button style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.4rem; border-radius: 6px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.color='white'"><i class="fas fa-ellipsis-v" style="width: 14px;"></i></button>
                    </td>
                </tr>
            `;
        });
        leadsTableBody.innerHTML = html;
    }
});
