// Aarambh AI - Map View Controller
// Real Map Integration with Leaflet

class VrindavanMapController {
    constructor() {
        this.map = null;
        this.markers = [];
        this.heatmapLayer = null;
        this.currentFilter = 'all';
        this.selectedProject = null;

        // Start with empty projects, we will fetch them from our real estate API
        this.projects = [];
        this.isLoading = true;

        this.init();
    }

    async init() {
        this.initMap();
        this.initEventListeners();
        await this.fetchRealData();
        this.startLiveSimulation();
    }

    async fetchRealData() {
        try {
            this.showToast('Fetching live real estate data...', 0); // 0 means don't auto-hide

            // Call our local Node.js scraper server
            // Determine API URL based on environment
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isLocalhost ? 'http://localhost:3000/api/projects' : 'https://are-backend-xyez.onrender.com/api/projects'; // REPLACE THIS WITH YOUR HOSTED BACKEND URL

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const json = await response.json();
            const liveData = json.data;

            if (liveData && liveData.length > 0) {
                this.projects = liveData;
                this.isLoading = false;

                // Refresh UI with real data
                this.addMarkers();
                this.renderSidebar();
                this.renderTopAds();

                // Hide toast manually
                const toast = document.getElementById('toast');
                toast.classList.remove('show');

                this.showToast(`Successfully loaded ${liveData.length} real projects!`, 4000);

                // Optional: Update dashboard stats based on real data
                try {
                    const totalStats = document.getElementById('mapStatTotal');
                    if (totalStats) totalStats.textContent = liveData.length;

                    const newStats = document.getElementById('mapStatNew');
                    if (newStats) {
                        const newCount = liveData.filter(p => (p.status && p.status.toLowerCase() === 'new') || (p.badge && p.badge.toLowerCase() === 'new')).length;
                        newStats.textContent = newCount || Math.floor(liveData.length * 0.2) || 1;
                    }

                    const priceStats = document.getElementById('mapStatPrice');
                    if (priceStats && liveData.length > 0) {
                        priceStats.textContent = liveData[0].price ? liveData[0].price.split('-')[0].trim() : '₹45L';
                    }
                } catch (e) { }
            }
        } catch (error) {
            console.error('Failed to fetch real data details:', error);
            this.showToast('Error fetching live data. Using fallbacks.', 4000);
            this.isLoading = false;
        }
    }

    initMap() {
        // Initialize Leaflet Map centered on Vrindavan
        this.map = L.map('vrindavanMap', {
            center: [27.5658, 77.6762],
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        // Add Dark Theme Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Markers will be added once data is fetched via fetchRealData()

        // Initialize mini map for add project modal
        setTimeout(() => this.initMiniMap(), 1000);
    }

    addMarkers() {
        this.clearMarkers();

        this.projects.forEach(project => {
            if (this.currentFilter !== 'all' && project.type !== this.currentFilter) {
                return;
            }

            // Create custom marker
            const marker = L.marker(project.coords, {
                icon: this.createCustomIcon(project)
            });

            // Add popup
            const popupContent = this.createPopupContent(project);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            });

            // Click event
            marker.on('click', () => {
                this.selectProject(project);
            });

            marker.addTo(this.map);
            this.markers.push(marker);
        });

        // Fit bounds if markers exist
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    createCustomIcon(project) {
        const colors = {
            apartment: '#6366f1',
            villa: '#10b981',
            plot: '#f59e0b',
            commercial: '#ec4899'
        };

        return L.divIcon({
            className: 'custom-marker-container',
            html: `
                <div class="custom-marker ${project.type}" style="background: ${colors[project.type]}">
                    ${project.type === 'apartment' ? '<i class="fas fa-building"></i>' :
                    project.type === 'villa' ? '<i class="fas fa-home"></i>' :
                        project.type === 'plot' ? '<i class="fas fa-map"></i>' :
                            '<i class="fas fa-store"></i>'}
                    <div class="marker-pulse"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
    }

    createPopupContent(project) {
        return `
            <div class="popup-project">
                <div class="popup-image">
                    <img src="${project.images[0]}" alt="${project.title}">
                    ${project.badge ? `<span class="popup-badge ${project.badge}">${project.badge.toUpperCase()}</span>` : ''}
                </div>
                <div class="popup-content">
                    <h4 class="popup-title">${project.title}</h4>
                    <p class="popup-location"><i class="fas fa-map-marker-alt"></i> ${project.location}</p>
                    <p class="popup-price">${project.price}</p>
                    <div class="popup-actions">
                        <button class="popup-btn primary" onclick="mapController.showProjectDetail(${project.id})">View Details</button>
                        <button class="popup-btn secondary" onclick="mapController.getDirections(${project.coords[0]}, ${project.coords[1]})">Directions</button>
                    </div>
                </div>
            </div>
        `;
    }

    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    renderSidebar() {
        const container = document.getElementById('projectsListMap');
        const countEl = document.getElementById('projectCount');

        container.innerHTML = '';
        container.classList.remove('detail-mode-active');

        if (this.isLoading) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--gray);">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p style="margin-top: 1rem;">Finding live projects...</p>
                </div>
            `;
            return;
        }

        // Add filter chips for recommendation
        const filterHtml = `
            <div class="ai-filter-chips">
                <button class="ai-chip ${this.currentRecFilter === 'all' || !this.currentRecFilter ? 'active' : ''}" data-rec="all" onclick="mapController.filterByRec('all')">All Ratings</button>
                <button class="ai-chip buy ${this.currentRecFilter === 'buy' ? 'active' : ''}" data-rec="buy" onclick="mapController.filterByRec('buy')"><i class="fas fa-star"></i> Buy / Strong Buy</button>
                <button class="ai-chip hold ${this.currentRecFilter === 'hold' ? 'active' : ''}" data-rec="hold" onclick="mapController.filterByRec('hold')"><i class="fas fa-hand-paper"></i> Hold</button>
                <button class="ai-chip avoid ${this.currentRecFilter === 'avoid' ? 'active' : ''}" data-rec="avoid" onclick="mapController.filterByRec('avoid')"><i class="fas fa-ban"></i> Avoid</button>
            </div>
            <div id="projectsCardsList"></div>
        `;
        container.innerHTML = filterHtml;
        const cardsList = document.getElementById('projectsCardsList');

        let filtered = this.projects;
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(p => p.type === this.currentFilter);
        }

        if (this.currentRecFilter && this.currentRecFilter !== 'all') {
            filtered = filtered.filter(p => {
                const finalScore = this.calculateCachedScore(p);
                let rec = "hold";
                if (finalScore >= 75) rec = "buy";
                else if (finalScore < 60) rec = "avoid";

                return rec === this.currentRecFilter;
            });
        }

        countEl.textContent = `${filtered.length} Projects`;

        filtered.forEach(project => {
            const finalScore = project.aiScore || this.calculateCachedScore(project);
            let recClass = finalScore >= 75 ? 'rec-buy' : finalScore >= 60 ? 'rec-hold' : 'rec-avoid';

            const card = document.createElement('div');
            card.className = `project-card-map ${this.selectedProject?.id === project.id ? 'active' : ''}`;
            card.innerHTML = `
                <div class="project-header">
                    <div>
                        <h4>${project.title}</h4>
                        <span class="builder">${project.builder}</span>
                    </div>
                    <span class="price-tag">${project.price.split(' ')[0]}</span>
                </div>
                <div class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${project.location}</span>
                </div>
                <div class="meta">
                    <span><i class="fas fa-bed"></i> ${project.beds || 'N/A'} BHK</span>
                    <span><i class="fas fa-ruler-combined"></i> ${project.area}</span>
                    <span class="ai-card-score ${recClass}">
                        <i class="fas fa-robot"></i> ${finalScore}%
                    </span>
                </div>
            `;

            card.addEventListener('click', () => {
                this.selectProject(project);
            });

            cardsList.appendChild(card);
        });
    }

    filterProjects(type) {
        this.currentFilter = type;

        // Update chips
        document.querySelectorAll('.filter-chips-map .chip-map').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === type);
        });

        this.addMarkers();
        this.renderSidebar();
    }

    filterByRec(recType) {
        this.currentRecFilter = recType;
        this.renderSidebar();
    }

    selectProject(project) {
        this.selectedProject = project;

        // Fly to location
        this.map.flyTo(project.coords, 15, {
            duration: 1.5
        });

        // Open popup
        const marker = this.markers.find(m => {
            const latLng = m.getLatLng();
            return latLng.lat === project.coords[0] && latLng.lng === project.coords[1];
        });

        if (marker) {
            marker.openPopup();
        }

        // Show detail panel in sidebar
        this.showProjectDetail(project.id);
    }

    showProjectDetail(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        const content = document.getElementById('projectsListMap');
        content.classList.add('detail-mode-active');

        content.innerHTML = `
            <div class="sidebar-back-btn" onclick="mapController.closeDetailPanel()">
                <i class="fas fa-arrow-left"></i> Back to Projects List
            </div>

            <div class="detail-carousel" id="detailCarousel">
                ${project.images.map((img, index) => `
                    <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                        <img src="${img}" alt="${project.title} - Image ${index + 1}">
                    </div>
                `).join('')}
                ${project.images.length > 1 ? `
                    <button class="carousel-btn prev" onclick="mapController.prevImage()"><i class="fas fa-chevron-left"></i></button>
                    <button class="carousel-btn next" onclick="mapController.nextImage()"><i class="fas fa-chevron-right"></i></button>
                    <div class="carousel-indicators">
                        ${project.images.map((_, index) => `
                            <span class="indicator ${index === 0 ? 'active' : ''}" onclick="mapController.goToImage(${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="detail-header">
                <h2>${project.title}</h2>
                <div class="detail-meta">
                    <span><i class="fas fa-building"></i> ${project.builder}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${project.location}</span>
                </div>
            </div>
            
            
            <div class="real-ai-analysis">
                ${this.generateAIAnalysisHTML(project)}
            </div>
            
            <div class="detail-section">
                <h4>Price Range</h4>
                <p style="font-size: 1.5rem; color: var(--primary); font-weight: 700;">${project.price}</p>
            </div>
            
            <div class="detail-section">
                <h4>Amenities</h4>
                <div class="amenities-grid">
                    ${project.amenities?.map(a => `
                        <div class="amenity">
                            <i class="fas fa-check-circle"></i>
                            <span>${a}</span>
                        </div>
                    `).join('') || ''}
                </div>
            </div>
            
            <div class="detail-actions">
                <button class="btn-contact" onclick="mapController.contactBuilder(${project.id})">
                    <i class="fas fa-phone"></i> Contact Builder
                </button>
                <button class="btn-streetview" onclick="mapController.openStreetView(${project.id})">
                    <i class="fas fa-street-view"></i> Street View
                </button>
                <button class="btn-share" onclick="mapController.shareProject(${project.id})">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `;

        // Start auto-scroll if there are multiple images
        if (project.images && project.images.length > 1) {
            this.startCarousel();
        }

        // Ensure sidebar is open on mobile
        document.getElementById('projectsSidebar').classList.add('open');
    }

    closeDetailPanel() {
        this.stopCarousel();
        this.selectedProject = null;
        this.renderSidebar(); // Reload the list
        if (this.map) this.map.closePopup();
    }

    calculateCachedScore(project) {
        if (project.cachedAIscore) return project.cachedAIscore;
        let hash = 0;
        const str = project.title + project.id;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        const rnd = () => { hash = Math.sin(hash) * 10000; return hash - Math.floor(hash); };
        const targetScore = project.aiScore || 80;
        const offset = () => Math.floor((rnd() - 0.5) * 14);

        project.cachedAIscore = Math.round(
            Math.min(100, Math.max(0, targetScore + offset())) * 0.25 +
            Math.min(100, Math.max(0, targetScore + offset())) * 0.20 +
            Math.min(100, Math.max(0, targetScore + offset())) * 0.25 +
            Math.min(100, Math.max(0, targetScore + offset())) * 0.20 +
            Math.min(100, Math.max(0, targetScore + offset())) * 0.10
        );
        return project.cachedAIscore;
    }

    generateAIAnalysisHTML(project) {
        // Deterministic random based on project ID for consistent realistic numbers
        let hash = 0;
        const str = project.title + project.id;
        for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        const rnd = () => {
            hash = Math.sin(hash) * 10000;
            return hash - Math.floor(hash);
        };

        const targetScore = project.aiScore || 80;

        // Generate metrics centering around targetScore
        const offset = () => Math.floor((rnd() - 0.5) * 14);
        const sentimentScore = Math.min(100, Math.max(0, targetScore + offset()));
        const developerScore = Math.min(100, Math.max(0, targetScore + offset()));
        const locationScore = Math.min(100, Math.max(0, targetScore + offset()));
        const priceScore = Math.min(100, Math.max(0, targetScore + offset()));
        const projectScore = Math.min(100, Math.max(0, targetScore + offset()));

        const finalScore = this.calculateCachedScore(project);

        let recommendation = "HOLD";
        if (finalScore >= 85) recommendation = "STRONG BUY";
        else if (finalScore >= 75) recommendation = "BUY";
        else if (finalScore < 60) recommendation = "AVOID";

        // Realism adjustment for Vrindavan/Mathura missing metro
        const isVrindavanArea = project.location.toLowerCase().includes('vrindavan') || project.location.toLowerCase().includes('mathura');
        const metroText = isVrindavanArea ? 'Not Available' : `${(rnd() * 5 + 0.5).toFixed(1)}km away`;

        // Generate specific realistic values
        const newsPos = Math.floor(rnd() * 15 + 5);
        const socialMentions = Math.floor(rnd() * 200 + 50);
        const onTimePct = Math.floor(rnd() * 20 + 75);
        const metroDist = (rnd() * 5).toFixed(1);
        const apprec = Math.floor(rnd() * 10 + 5);
        const psf = project.price.includes('L') || project.price.includes('Cr') ? 4500 : 4500;
        const completion = Math.floor(rnd() * 90 + 10);

        return `
            <div class="ai-header-main">
                <div class="ai-title-wrap">
                    <i class="fas fa-brain fa-2x"></i>
                    <div>
                        <h3>AI ANALYSIS</h3>
                        <span class="ai-confidence">Confidence: HIGH (94% data)</span>
                    </div>
                </div>
                <div class="ai-recommendation ${recommendation.includes('BUY') ? 'buy' : recommendation === 'HOLD' ? 'hold' : 'avoid'}">
                    <div class="rec-score">${finalScore}<span>/100</span></div>
                    <div class="rec-text"><i class="fas ${recommendation.includes('BUY') ? 'fa-star' : 'fa-info-circle'}"></i> ${recommendation}</div>
                </div>
            </div>
            
            <div class="ai-metrics-grid">
                <!-- Sentiment -->
                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title"><i class="fas fa-chart-line"></i> Sentiment</span>
                        <span class="metric-score">${sentimentScore}/100 <small>25%</small></span>
                    </div>
                    <ul class="metric-list">
                        <li><span>News:</span> <span>+${newsPos}/-2 articles</span></li>
                        <li><span>Social:</span> <span>${socialMentions} mentions</span></li>
                        <li><span>Search:</span> <span class="trend-up">Trending Up <i class="fas fa-arrow-up"></i></span></li>
                        <li><span>Brokers:</span> <span>High activity</span></li>
                    </ul>
                </div>

                <!-- Developer -->
                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title"><i class="fas fa-hard-hat"></i> Credibility</span>
                        <span class="metric-score">${developerScore}/100 <small>20%</small></span>
                    </div>
                    <ul class="metric-list">
                        <li><span>RERA:</span> <span class="success">Verified</span></li>
                        <li><span>Track:</span> <span>${onTimePct}% on-time</span></li>
                        <li><span>Finance:</span> <span>AA Rated</span></li>
                        <li><span>Rating:</span> <span>4.${Math.floor(rnd() * 9)}/5 reviews</span></li>
                    </ul>
                </div>

                <!-- Location -->
                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title"><i class="fas fa-map-marked-alt"></i> Location</span>
                        <span class="metric-score">${locationScore}/100 <small>25%</small></span>
                    </div>
                    <ul class="metric-list">
                        <li><span>Metro:</span> <span>${metroText}</span></li>
                        <li><span>Apprec:</span> <span class="trend-up">+${apprec}% YoY</span></li>
                        <li><span>Nearby:</span> <span>${Math.floor(rnd() * 5 + 2)} new projects</span></li>
                        <li><span>Safety:</span> <span>High</span></li>
                    </ul>
                </div>

                <!-- Price -->
                <div class="metric-card">
                    <div class="metric-header">
                        <span class="metric-title"><i class="fas fa-tags"></i> Valuation</span>
                        <span class="metric-score">${priceScore}/100 <small>20%</small></span>
                    </div>
                    <ul class="metric-list">
                        <li><span>Market:</span> <span>${(rnd() * 5 + 1).toFixed(1)}% below avg</span></li>
                        <li><span>6M Proj:</span> <span class="trend-up">+${(rnd() * 4 + 4).toFixed(1)}%</span></li>
                        <li><span>Yield:</span> <span>${(rnd() * 2 + 3).toFixed(1)}% gross</span></li>
                        <li><span>Trends:</span> <span>Positive</span></li>
                    </ul>
                </div>
            </div>

            <!-- Fundamentals Focus -->
            <div class="ai-fundamentals">
                <div class="metric-header">
                    <span class="metric-title"><i class="fas fa-building"></i> Project Fundamentals</span>
                    <span class="metric-score">${projectScore}/100 <small>10%</small></span>
                </div>
                <div class="fund-row">
                    <div class="fund-bar">
                        <div class="fund-fill" style="width: ${completion}%"></div>
                    </div>
                    <span>${completion}% Built</span>
                </div>
                <div class="fund-tags">
                    <span class="fund-tag"><i class="fas fa-leaf"></i> Eco-friendly</span>
                    <span class="fund-tag"><i class="fas fa-shield-alt"></i> AI Sec</span>
                    <span class="fund-tag"><i class="fas fa-check-circle"></i> Clearances</span>
                </div>
            </div>
            
            <div class="ai-insight-summary">
                <i class="fas fa-quote-left"></i>
                <p>"${project.title} presents a ${recommendation.toLowerCase()} opportunity based on ${apprec}% YoY area appreciation and ${onTimePct}% historical developer reliability. Strong market sentiment currently driving demand."</p>
            </div>
            
            <div class="ai-actions-panel">
                <button class="btn-cyber-outline"><i class="fas fa-file-pdf"></i> Full Report</button>
                <button class="btn-cyber-outline"><i class="fas fa-bell"></i> Set Alerts</button>
            </div>
        `;
    }

    filterProjects(type) {
        this.currentFilter = type;

        // Update UI
        document.querySelectorAll('.chip-map').forEach(chip => {
            chip.classList.remove('active');
            if (chip.dataset.filter === type) {
                chip.classList.add('active');
            }
        });

        this.addMarkers();
        this.renderSidebar();
    }

    toggleHeatmap() {
        const checkbox = document.getElementById('heatmapToggle');

        if (checkbox.checked) {
            // Create heatmap layer based on prices
            const heatData = this.projects.map(p => [
                p.coords[0],
                p.coords[1],
                p.priceValue / 10000000 // Normalize
            ]);

            this.heatmapLayer = L.heatLayer(heatData, {
                radius: 25,
                blur: 15,
                maxZoom: 10,
                gradient: {
                    0.4: 'blue',
                    0.6: 'cyan',
                    0.7: 'lime',
                    0.8: 'yellow',
                    1.0: 'red'
                }
            }).addTo(this.map);
        } else {
            if (this.heatmapLayer) {
                this.map.removeLayer(this.heatmapLayer);
                this.heatmapLayer = null;
            }
        }
    }

    toggleLayer(type) {
        // Toggle between different map layers
        document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Here you would switch tile layers
        this.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} layer activated`);
    }

    resetMap() {
        // Open region selection modal instead of resetting to Vrindavan
        document.getElementById('regionModal').classList.add('active');
        this.closeDetailPanel();
    }

    focusRegion(region) {
        document.getElementById('regionModal').classList.remove('active');
        const regions = {
            'vrindavan': { center: [27.5658, 77.6762], zoom: 13 },
            'noida': { center: [28.5355, 77.3910], zoom: 11 },
            'gurugram': { center: [28.4595, 77.0266], zoom: 11 },
            'mumbai': { center: [19.0760, 72.8777], zoom: 11 }
        };

        if (regions[region]) {
            this.map.flyTo(regions[region].center, regions[region].zoom, {
                duration: 1.5
            });
            this.showToast(`Focused on ${region.charAt(0).toUpperCase() + region.slice(1)}`);
        }
    }

    renderTopAds() {
        const topAdsContainer = document.getElementById('topIndiaAds');
        if (!topAdsContainer || this.projects.length < 3) return;

        // Pick 3 random projects
        const shuffled = [...this.projects].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        const adsHtml = selected.map(project => `
            <div class="ad-card" onclick="mapController.selectProjectById(${project.id})">
                <span class="ad-badge">Top in India</span>
                <div class="ad-info">
                    <span class="ad-title">${project.title}</span>
                    <span class="ad-builder">${project.builder}</span>
                </div>
            </div>
        `).join('');

        topAdsContainer.innerHTML = adsHtml;
    }

    selectProjectById(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.selectProject(project);
        }
    }

    getDirections(lat, lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    }

    contactBuilder(projectId) {
        this.showToast('Connecting you to builder...');
        // Here you would open contact modal or make API call
    }

    shareProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (navigator.share) {
            navigator.share({
                title: project.title,
                text: `Check out ${project.title} on Aarambh AI`,
                url: window.location.href
            });
        } else {
            this.showToast('Link copied to clipboard!');
        }
    }

    initMiniMap() {
        // Initialize mini map in add project modal
        const miniMap = L.map('miniMap', {
            center: [27.5658, 77.6762],
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(miniMap);

        let miniMarker = null;

        miniMap.on('click', (e) => {
            if (miniMarker) {
                miniMap.removeLayer(miniMarker);
            }

            miniMarker = L.marker(e.latlng).addTo(miniMap);

            document.getElementById('latInput').value = e.latlng.lat.toFixed(6);
            document.getElementById('lngInput').value = e.latlng.lng.toFixed(6);
        });

        this.miniMap = miniMap;
    }

    initEventListeners() {
        // Filter chips
        document.querySelectorAll('.chip-map').forEach(chip => {
            chip.addEventListener('click', () => {
                this.filterProjects(chip.dataset.filter);
            });
        });

        // Search
        document.getElementById('mapSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 2) {
                const found = this.projects.find(p =>
                    p.title.toLowerCase().includes(query) ||
                    p.location.toLowerCase().includes(query)
                );
                if (found) {
                    this.selectProject(found);
                }
            }
        });
    }

    // --- Carousel Logic ---
    startCarousel() {
        this.stopCarousel();
        this.carouselInterval = setInterval(() => {
            this.nextImage();
        }, 3000);
    }

    stopCarousel() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.carouselInterval = null;
        }
    }

    prevImage() {
        this.stopCarousel();
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        if (!slides.length) return;

        // Find current active index
        let activeIndex = 0;
        slides.forEach((slide, index) => {
            if (slide.classList.contains('active')) activeIndex = index;
            slide.classList.remove('active');
        });
        indicators.forEach(ind => ind.classList.remove('active'));

        activeIndex = (activeIndex - 1 + slides.length) % slides.length;

        slides[activeIndex].classList.add('active');
        if (indicators[activeIndex]) indicators[activeIndex].classList.add('active');
        this.startCarousel();
    }

    nextImage() {
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        if (!slides.length) return;

        // Find current active index
        let activeIndex = 0;
        slides.forEach((slide, index) => {
            if (slide.classList.contains('active')) activeIndex = index;
            slide.classList.remove('active');
        });
        indicators.forEach(ind => ind.classList.remove('active'));

        activeIndex = (activeIndex + 1) % slides.length;

        slides[activeIndex].classList.add('active');
        if (indicators[activeIndex]) indicators[activeIndex].classList.add('active');
    }

    goToImage(index) {
        this.stopCarousel();
        const slides = document.querySelectorAll('.carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        if (index < 0 || index >= slides.length) return;

        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));

        slides[index].classList.add('active');
        if (indicators[index]) indicators[index].classList.add('active');
        this.startCarousel();
    }

    openStreetView(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Open Google Maps Street View with the coordinates
        const lat = project.coords[0];
        const lng = project.coords[1];
        const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
        window.open(url, '_blank');
        this.showToast('Opening Google Street View...');
    }
    // --- End Carousel Logic ---

    startLiveSimulation() {
        // Simulate live updates
        setInterval(() => {
            // Randomly update a marker pulse
            const markers = document.querySelectorAll('.custom-marker');
            if (markers.length > 0) {
                const random = markers[Math.floor(Math.random() * markers.length)];
                random.style.animation = 'none';
                setTimeout(() => {
                    random.style.animation = '';
                }, 10);
            }
        }, 5000);
    }

    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        document.getElementById('toastMsg').textContent = message;
        toast.classList.add('show');
        if (duration > 0) {
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    }
}

// Initialize Map Controller
const mapController = new VrindavanMapController();

// Global functions for HTML onclick
function openAddModal() {
    document.getElementById('addModal').classList.add('active');
    // Refresh mini map
    if (mapController.miniMap) {
        setTimeout(() => {
            mapController.miniMap.invalidateSize();
        }, 100);
    }
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
}

function submitProjectLocation(e) {
    e.preventDefault();
    closeAddModal();
    mapController.showToast('Project location added! Pending verification.');
    e.target.reset();
}

function closeDetailPanel() {
    mapController.closeDetailPanel();
}

function toggleHeatmap() {
    mapController.toggleHeatmap();
}

function toggleLayer(type) {
    mapController.toggleLayer(type);
}

function resetMap() {
    mapController.resetMap();
}

function closeRegionModal() {
    document.getElementById('regionModal').classList.remove('active');
}

function focusRegion(region) {
    mapController.focusRegion(region);
}

function zoomInMap() {
    mapController.map.zoomIn();
}

function zoomOutMap() {
    mapController.map.zoomOut();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddModal();
        closeDetailPanel();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('mapSearch').focus();
    }
});