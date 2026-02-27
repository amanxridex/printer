// Aarambh AI - Real Estate Intelligence System
// Developer: You (The Legend)

class AarambhAI {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.currentView = 'grid';
        this.isLoading = true;
        this.init();
    }

    async init() {
        this.initMatrixRain();
        this.initParticles();
        // Wait for real data before rendering
        await this.fetchRealData();
        this.initEventListeners();
        this.startLiveUpdates();
    }

    async fetchRealData() {
        try {
            this.showToast('Fetching live Indian real estate data...', 0);

            // Determine API URL based on environment
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isLocalhost ? 'http://localhost:3000/api/projects' : 'https://are-backend-xyez.onrender.com/api/projects'; // REPLACE THIS WITH YOUR HOSTED BACKEND URL

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('API Error');

            const json = await response.json();
            const liveData = json.data;

            if (liveData && liveData.length > 0) {
                // Map the scraped data to the format expected by the dashboard
                this.projects = liveData.map(p => ({
                    id: p.id,
                    title: p.title,
                    builder: p.builder || 'Verified Builder',
                    location: p.location,
                    type: p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : 'Apartment',
                    price: p.price,
                    beds: p.beds || 2,
                    baths: p.beds || 2, // Assuming same as beds
                    area: p.area || 'Size on Request',
                    status: p.status,
                    badge: p.badge || 'new',
                    badgeText: (p.badge || 'NEW').toUpperCase(),
                    image: (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                    aiScore: p.aiScore || Math.floor(Math.random() * 15) + 80,
                    aiInsight: p.description || "Live data insights dynamically loaded.",
                    trending: Math.random() > 0.5
                }));

                this.filteredProjects = [...this.projects];
                this.isLoading = false;
                this.renderProjects();

                this.updateRealStats(this.projects);
                this.updateRealNewsTicker(this.projects);
                this.updateRealInsights(this.projects);
                this.animateStats();

                document.getElementById('toast').classList.remove('show');
                this.showToast(`Loaded ${this.projects.length} real projects!`, 4000);
            }
        } catch (error) {
            console.error('Failed to fetch real data details:', error);
            this.showToast('Error fetching live data. Check if server is running.', 4000);
            this.isLoading = false;
            this.renderProjects(); // Render empty or state
        }
    }



    updateRealStats(projects) {
        if (!projects || projects.length === 0) return;
        const statActive = document.getElementById('statActiveProjects');
        if (statActive) statActive.dataset.target = projects.length;
        const newLaunches = projects.filter(p => (p.status && p.status.toLowerCase() === 'new') || (p.badge && p.badge.toLowerCase() === 'new')).length;
        const statNew = document.getElementById('statNewLaunches');
        if (statNew) statNew.dataset.target = newLaunches || Math.floor(projects.length * 0.2) || 1;
        const totalScore = projects.reduce((acc, p) => acc + (p.aiScore || 85), 0);
        const avgScore = totalScore / projects.length;
        const statPriceGrowth = document.getElementById('statPriceGrowth');
        if (statPriceGrowth) statPriceGrowth.dataset.target = avgScore.toFixed(1);
        const dataPoints = projects.length * 156;
        const statData = document.getElementById('statAIDataPoints');
        if (statData) statData.dataset.target = dataPoints;
        const holoProjects = document.getElementById('holoProjects');
        if (holoProjects) holoProjects.textContent = projects.length;
    }

    updateRealNewsTicker(projects) {
        const tickerTrack = document.getElementById('newsTickerTrack');
        if (!tickerTrack || projects.length === 0) return;
        const newsItems = [];
        const templates = [
            (p) => `${p.builder} recently updated status for ${p.title} in ${p.location}`,
            (p) => `AI Detects high interest for ${p.title} - Expected score ${p.aiScore}`,
            (p) => `Price update logged for ${p.title} at ${p.price}`,
            (p) => `New ${p.type} opportunity spotted in ${p.location}`
        ];
        const recentProjects = projects.slice(0, 8);
        let timeCurrent = new Date();
        recentProjects.forEach((p, index) => {
            timeCurrent.setMinutes(timeCurrent.getMinutes() - Math.floor(Math.random() * 15 + 5));
            const timeStr = timeCurrent.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const tag = index % 2 === 0 ? 'UPDATE' : 'ALERT';
            const tagClass = tag.toLowerCase();
            const text = templates[index % templates.length](p);
            newsItems.push(`
                <div class="ticker-item">
                    <span class="ticker-time">${timeStr}</span>
                    <span class="ticker-tag ${tagClass}">${tag}</span>
                    <span class="ticker-text">${text}</span>
                </div>
            `);
        });
        tickerTrack.innerHTML = newsItems.join('') + newsItems.join('');
    }

    updateRealInsights(projects) {
        const grid = document.getElementById('aiInsightsGrid');
        if (!grid || projects.length === 0) return;
        const topProjects = [...projects].sort((a, b) => b.aiScore - a.aiScore).slice(0, 3);
        const icons = ['fa-fire', 'fa-arrow-trend-up', 'fa-crystal-ball'];
        const types = ['hot', 'trend', 'prediction'];
        const insightsHtml = topProjects.map((p, index) => {
            return `
                <div class="insight-card ${types[index % types.length]}">
                    <div class="insight-glow"></div>
                    <div class="insight-icon"><i class="fas ${icons[index % icons.length]}"></i></div>
                    <h4>${p.title}</h4>
                    <p>AI generated insight for ${p.builder}'s project in ${p.location}. ${p.aiInsight || 'Market looks promising.'}</p>
                    <div class="insight-meta">
                        <span class="confidence">AI Score: ${p.aiScore}%</span>
                        <button class="btn-sm" onclick="aarambh.filterProjects('all'); setTimeout(() => aarambh.searchProjects('${p.title.replace(/'/g, "\\'")}'), 100)">View</button>
                    </div>
                </div>
            `;
        }).join('');
        grid.innerHTML = insightsHtml;
    }

    // Matrix Rain Effect
    initMatrixRain() {
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'アイウエオカキクケコサシスセソタチツテト0123456789';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#6366f1';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setInterval(draw, 35);

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // Floating Particles
    initParticles() {
        const container = document.getElementById('particles');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            container.appendChild(particle);
        }
    }

    // Animate Statistics
    animateStats() {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const target = parseFloat(stat.dataset.target);
            const decimal = parseInt(stat.dataset.decimal) || 0;
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const update = () => {
                current += step;
                if (current < target) {
                    stat.textContent = current.toFixed(decimal);
                    requestAnimationFrame(update);
                } else {
                    stat.textContent = target.toFixed(decimal);
                }
            };

            update();
        });
    }

    // Render Projects
    renderProjects() {
        const container = document.getElementById('projectsContainer');

        if (this.isLoading) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--primary);">
                    <i class="fas fa-spinner fa-spin fa-3x" style="margin-bottom: 20px;"></i>
                    <h2 style="font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 2px;">Establishing Neural Link to Web Brokers...</h2>
                    <p style="color: var(--gray); margin-top: 10px;">Scraping live data from properties around Vrindavan.</p>
                </div>
            `;
            container.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        container.innerHTML = '';

        if (this.filteredProjects.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--gray);">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p style="margin-top: 1rem;">No real projects found or scraper server is offline.</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        this.filteredProjects.forEach(project => {
            const card = this.createProjectCard(project);
            container.appendChild(card);
        });
    }

    createProjectCard(project) {
        const div = document.createElement('div');
        div.className = 'project-cyber-card';
        div.innerHTML = `
            <div class="project-image-wrap">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="project-badges">
                    <span class="cyber-badge ${project.badge}">${project.badgeText}</span>
                    ${project.trending ? '<span class="cyber-badge hot">TRENDING</span>' : ''}
                </div>
                <div class="project-actions">
                    <button class="action-btn" onclick="aarambh.toggleFavorite(${project.id})">
                        <i class="far fa-heart"></i>
                    </button>
                    <button class="action-btn">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <div class="ai-analysis-badge">
                    <i class="fas fa-robot"></i>
                    <span>AI Analysis: ${project.aiScore}%</span>
                </div>
            </div>
            <div class="project-info">
                <div class="project-meta">
                    <div class="project-title-wrap">
                        <h3>${project.title}</h3>
                        <span class="project-builder">${project.builder}</span>
                    </div>
                    <div class="ai-score">
                        <i class="fas fa-brain"></i>
                        <span>${project.aiScore}</span>
                    </div>
                </div>
                <div class="project-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${project.location}</span>
                </div>
                <div class="project-specs-cyber">
                    ${project.beds ? `
                        <div class="spec-cyber">
                            <i class="fas fa-bed"></i>
                            <span>${project.beds} BHK</span>
                        </div>
                    ` : ''}
                    <div class="spec-cyber">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${project.area}</span>
                    </div>
                    <div class="spec-cyber">
                        <i class="fas fa-building"></i>
                        <span>${project.type}</span>
                    </div>
                </div>
                <div class="ai-insight-text" style="font-size: 0.85rem; color: var(--primary); margin-bottom: 1rem; font-style: italic;">
                    <i class="fas fa-lightbulb"></i> ${project.aiInsight}
                </div>
                <div class="project-footer-cyber">
                    <div class="price-wrap">
                        <span class="price-label">Starting from</span>
                        <span class="price-value">${project.price}</span>
                    </div>
                    <button class="btn-view">View Details</button>
                </div>
            </div>
        `;
        return div;
    }

    // Filter Projects
    filterProjects(category) {
        // Update active chip
        document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
        event.target.classList.add('active');

        if (category === 'all') {
            this.filteredProjects = [...this.projects];
        } else {
            this.filteredProjects = this.projects.filter(p => {
                if (category === 'launch') return p.status === 'new';
                if (category === 'residential') return ['Apartment', 'Villa'].includes(p.type);
                if (category === 'commercial') return p.type === 'Commercial';
                if (category === 'plots') return p.type === 'Plot';
                if (category === 'villa') return p.type === 'Villa';
                return true;
            });
        }

        this.renderProjects();
    }

    // Search Projects
    searchProjects(query) {
        const lowerQuery = query.toLowerCase();
        this.filteredProjects = this.projects.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.builder.toLowerCase().includes(lowerQuery) ||
            p.location.toLowerCase().includes(lowerQuery)
        );
        this.renderProjects();
    }

    // Toggle View
    setView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        event.target.closest('.view-btn').classList.add('active');

        const container = document.getElementById('projectsContainer');
        if (view === 'list') {
            container.style.gridTemplateColumns = '1fr';
        } else {
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        }
    }

    // Toggle Favorite
    toggleFavorite(id) {
        const btn = event.currentTarget;
        const icon = btn.querySelector('i');

        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#ef4444';
            this.showToast('Added to favorites');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
        }
    }

    // Modal Functions
    openModal() {
        document.getElementById('addModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('addModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    submitProject(e) {
        e.preventDefault();
        this.closeModal();
        this.showToast('Project submitted for AI analysis!');
        e.target.reset();
    }

    // Toast Notification
    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        document.getElementById('toastMsg').textContent = message;
        toast.classList.add('show');
        if (duration > 0) {
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    }

    // AI Chat Functions
    toggleAI() {
        const chat = document.getElementById('aiChatWindow');
        chat.classList.toggle('active');
    }

    handleAIInput(e) {
        if (e.key === 'Enter') this.sendAIMessage();
    }

    sendAIMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        this.addAIMessage(message, 'user');
        input.value = '';

        // Simulate AI response
        setTimeout(() => {
            const project = this.projects && this.projects.length > 0 ? this.projects[Math.floor(Math.random() * this.projects.length)] : null;
            let responses = [
                "Bhai, Vrindavan mein naye projects hain. Details chahiye?",
                "AI analysis ke hisaab se market strong lag raha hai.",
                "RERA updates hamesha check karo investment se pehle."
            ];
            if (project) {
                responses = [
                    `Bhai, ${project.location} mein ek naya project hai '${project.title}' ${project.builder} ka, starting around ${project.price}. Details chahiye?`,
                    `AI analysis ke hisaab se, ${project.title} ka market score ${project.aiScore}% hai. Badhiya opportunity lag rahi hai.`,
                    `Agar badhiya property dekh rahe ho, toh ${project.location} mein ${project.title} check karo.`
                ];
            }
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addAIMessage(randomResponse, 'ai');
        }, 1000);
    }

    addAIMessage(text, sender) {
        const container = document.getElementById('aiMessages');
        const div = document.createElement('div');
        div.className = `ai-message ${sender}`;
        div.innerHTML = `
            <div class="ai-bubble">${text}</div>
            <span class="ai-time">Just now</span>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    // Live Updates Simulation
    startLiveUpdates() {
        setInterval(() => {
            // Randomly update a stat
            const stat = document.getElementById('holoProjects');
            if (stat) {
                const current = parseInt(stat.textContent);
                if (Math.random() > 0.7) {
                    stat.textContent = current + 1;
                }
            }
        }, 10000);
    }

    // Event Listeners
    initEventListeners() {
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchProjects(e.target.value);
        });

        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openModal();
            }
        });
    }
}

// Initialize
const aarambh = new AarambhAI();

// Global functions for HTML onclick
function openModal() { aarambh.openModal(); }
function closeModal() { aarambh.closeModal(); }
function submitProject(e) { aarambh.submitProject(e); }
function filterProjects(cat) { aarambh.filterProjects(cat); }
function setView(view) { aarambh.setView(view); }
function loadMore() {
    const btn = event.target;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    setTimeout(() => {
        btn.innerHTML = '<span class="btn-text">LOAD MORE PROJECTS</span><span class="btn-loader"></span>';
        aarambh.showToast('More projects loaded!');
    }, 1000);
}
function toggleAI() { aarambh.toggleAI(); }
function handleAIInput(e) { aarambh.handleAIInput(e); }
function sendAIMessage() { aarambh.sendAIMessage(); }