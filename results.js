document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const totalVotesElement = document.getElementById('totalVotes');
    const participationRateElement = document.getElementById('participationRate');
    const resultsContainer = document.getElementById('resultsContainer');
    const positionTabsContainer = document.getElementById('positionTabs');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    // Load data
    loadResults();
    updateLastUpdated();
    
    // Set interval to refresh data every 30 seconds
    setInterval(loadResults, 30000);
    setInterval(updateLastUpdated, 30000);
    
    function loadResults() {
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        // Update summary stats
        const totalVotes = votes.length;
        const totalStudents = students.length;
        const studentsVoted = students.filter(student => student.hasVoted).length;
        const participationRate = totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : '0.0';
        
        totalVotesElement.textContent = totalVotes;
        participationRateElement.textContent = `${participationRate}%`;
        
        // Clear tabs and results container
        positionTabsContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        
        if (positions.length === 0 || votes.length === 0) {
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'no-data-message';
            noDataMessage.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <p>No voting data available yet. Check back later when votes have been cast.</p>
            `;
            resultsContainer.appendChild(noDataMessage);
            return;
        }
        
        // Create tabs for each position
        positions.forEach((position, index) => {
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.className = 'position-tab-btn' + (index === 0 ? ' active' : '');
            tabButton.setAttribute('data-position-id', position.id);
            tabButton.innerHTML = `<i class="fas fa-user-tie"></i> ${position.title}`;
            
            tabButton.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('.position-tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show corresponding content
                document.querySelectorAll('.position-result').forEach(content => {
                    content.classList.remove('active');
                });
                
                document.getElementById(`position-${position.id}`).classList.add('active');
            });
            
            positionTabsContainer.appendChild(tabButton);
            
            // Create content for this position
            const positionContent = document.createElement('div');
            positionContent.className = 'position-result' + (index === 0 ? ' active' : '');
            positionContent.id = `position-${position.id}`;
            
            // Get votes for this position
            const positionVotes = votes.filter(vote => vote.positionId === position.id);
            
            // If no votes for this position
            if (positionVotes.length === 0) {
                const noVotesMessage = document.createElement('p');
                noVotesMessage.className = 'no-votes-message';
                noVotesMessage.innerHTML = `<i class="fas fa-info-circle"></i> No votes have been cast for ${position.title} yet.`;
                positionContent.appendChild(noVotesMessage);
                resultsContainer.appendChild(positionContent);
                return;
            }
            
            // Count votes per candidate
            const candidateVotes = {};
            const candidateNames = {};
            
            position.candidates.forEach(candidate => {
                candidateVotes[candidate.id] = 0;
                candidateNames[candidate.id] = candidate.name;
            });
            
            positionVotes.forEach(vote => {
                if (candidateVotes[vote.candidateId] !== undefined) {
                    candidateVotes[vote.candidateId]++;
                }
            });
            
            // Create results table
            const resultsTable = document.createElement('table');
            resultsTable.className = 'results-table';
            resultsTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Candidate</th>
                        <th>Votes</th>
                        <th>Percentage</th>
                        <th>Bar</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            const tbody = resultsTable.querySelector('tbody');
            
            // Sort candidates by votes (descending)
            const sortedCandidates = Object.entries(candidateVotes)
                .sort((a, b) => b[1] - a[1]);
            
            // Add rows for each candidate
            sortedCandidates.forEach(([candidateId, voteCount]) => {
                const percentage = positionVotes.length > 0 ? 
                    ((voteCount / positionVotes.length) * 100).toFixed(1) : '0.0';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${candidateNames[candidateId]}</td>
                    <td>${voteCount}</td>
                    <td>${percentage}%</td>
                    <td>
                        <div class="vote-bar-container">
                            <div class="vote-bar" style="width: ${percentage}%"></div>
                        </div>
                    </td>
                `;
                
                // Highlight winner
                if (sortedCandidates[0][0] === candidateId) {
                    row.classList.add('winner');
                }
                
                tbody.appendChild(row);
            });
            
            positionContent.appendChild(resultsTable);
            
            // Create canvas for chart
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'canvas-container';
            
            const canvas = document.createElement('canvas');
            canvas.id = `chart-${position.id}`;
            canvasContainer.appendChild(canvas);
            positionContent.appendChild(canvasContainer);
            
            resultsContainer.appendChild(positionContent);
            
            // Create chart (after the element is added to the DOM)
            setTimeout(() => {
                createChart(canvas.id, position.title, candidateNames, candidateVotes);
            }, 0);
        });
    }
    
    function createChart(canvasId, positionTitle, candidateNames, candidateVotes) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Extract data for chart
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const hoverBackgroundColors = [];
        
        // Color palette for chart
        const colorPalette = [
            ['rgba(52, 152, 219, 0.7)', 'rgba(52, 152, 219, 0.9)'],
            ['rgba(46, 204, 113, 0.7)', 'rgba(46, 204, 113, 0.9)'],
            ['rgba(155, 89, 182, 0.7)', 'rgba(155, 89, 182, 0.9)'],
            ['rgba(241, 196, 15, 0.7)', 'rgba(241, 196, 15, 0.9)'],
            ['rgba(231, 76, 60, 0.7)', 'rgba(231, 76, 60, 0.9)'],
            ['rgba(52, 73, 94, 0.7)', 'rgba(52, 73, 94, 0.9)']
        ];
        
        let colorIndex = 0;
        
        // Sort candidates by votes (descending)
        const sortedCandidates = Object.entries(candidateVotes)
            .sort((a, b) => b[1] - a[1]);
        
        sortedCandidates.forEach(([candidateId, voteCount]) => {
            labels.push(candidateNames[candidateId]);
            data.push(voteCount);
            
            // Cycle through colors
            const colorSet = colorPalette[colorIndex % colorPalette.length];
            backgroundColors.push(colorSet[0]);
            hoverBackgroundColors.push(colorSet[1]);
            
            colorIndex++;
        });
        
        // Create chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverBackgroundColor: hoverBackgroundColors,
                    borderWidth: 0,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: positionTitle,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? 
                                    ((context.raw / total) * 100).toFixed(1) : '0.0';
                                return `${context.raw} votes (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    function updateLastUpdated() {
        const now = new Date();
        lastUpdatedElement.textContent = now.toLocaleString();
    }
});