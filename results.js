document.addEventListener('DOMContentLoaded', function() {
    loadResults();
    
    // Update the last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
});

function loadResults() {
    const positions = JSON.parse(localStorage.getItem('positions')) || [];
    const votes = JSON.parse(localStorage.getItem('votes')) || [];
    const students = JSON.parse(localStorage.getItem('students')) || [];
    
    // Update summary stats
    document.getElementById('totalVotes').textContent = votes.length;
    document.getElementById('totalPositions').textContent = positions.length;
    
    const studentsVoted = students.filter(student => student.hasVoted).length;
    const participationRate = students.length > 0 ? 
        ((studentsVoted / students.length) * 100).toFixed(1) : '0.0';
    document.getElementById('participationRate').textContent = `${participationRate}%`;
    
    // Clear position tabs and results
    const positionTabs = document.getElementById('positionTabs');
    const positionResults = document.getElementById('positionResults');
    
    positionTabs.innerHTML = '';
    positionResults.innerHTML = '';
    
    if (positions.length === 0) {
        positionResults.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>No positions available.</p>
            </div>
        `;
        return;
    }
    
    // Create tabs for each position
    positions.forEach((position, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = `position-tab-btn ${index === 0 ? 'active' : ''}`;
        tabButton.setAttribute('data-position-id', position.id);
        tabButton.innerHTML = `<i class="fas fa-user-tie"></i> ${position.title}`;
        
        tabButton.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.position-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all position results
            document.querySelectorAll('.position-result').forEach(result => {
                result.style.display = 'none';
            });
            
            // Show the selected position result
            document.getElementById(`position-${position.id}`).style.display = 'block';
        });
        
        positionTabs.appendChild(tabButton);
        
        // Create result container for this position
        const resultContainer = document.createElement('div');
        resultContainer.className = 'position-result';
        resultContainer.id = `position-${position.id}`;
        resultContainer.style.display = index === 0 ? 'block' : 'none';
        
        // Get votes for this position
        const positionVotes = votes.filter(vote => vote.positionId === position.id);
        
        if (positionVotes.length === 0) {
            resultContainer.innerHTML = `
                <h3><i class="fas fa-chart-bar"></i> ${position.title}</h3>
                <div class="no-votes-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No votes have been cast for this position yet.</p>
                </div>
            `;
            positionResults.appendChild(resultContainer);
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
        
        // Create HTML for the position result
        resultContainer.innerHTML = `
            <h3><i class="fas fa-chart-bar"></i> ${position.title}</h3>
            <div class="results-table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Votes</th>
                            <th>Percentage</th>
                            <th>Progress</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-${position.id}"></tbody>
                </table>
            </div>
            <div class="graph-container">
                <canvas id="chart-${position.id}"></canvas>
            </div>
            <div class="vote-summary">
                <p>Total votes for this position: <span class="total">${positionVotes.length}</span></p>
            </div>
        `;
        
        positionResults.appendChild(resultContainer);
        
        // Populate the table with candidate results
        const tbody = document.getElementById(`tbody-${position.id}`);
        
        // Find the candidate with the most votes
        let maxVotes = 0;
        let winningCandidateId = null;
        
        for (const [candidateId, voteCount] of Object.entries(candidateVotes)) {
            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                winningCandidateId = candidateId;
            }
        }
        
        // Add rows for each candidate
        for (const [candidateId, voteCount] of Object.entries(candidateVotes)) {
            const percentage = positionVotes.length > 0 ? 
                ((voteCount / positionVotes.length) * 100).toFixed(1) : '0.0';
            
            const row = document.createElement('tr');
            if (candidateId === winningCandidateId && voteCount > 0) {
                row.className = 'winner';
            }
            
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
            
            tbody.appendChild(row);
        }
        
        // Create chart for this position
        createChart(position, candidateVotes, candidateNames);
    });
}

function createChart(position, candidateVotes, candidateNames) {
    const ctx = document.getElementById(`chart-${position.id}`).getContext('2d');
    
    // Prepare data for the chart
    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];
    
    // Color palette for the chart
    const colorPalette = [
        ['rgba(52, 152, 219, 0.7)', 'rgba(52, 152, 219, 1)'],
        ['rgba(46, 204, 113, 0.7)', 'rgba(46, 204, 113, 1)'],
        ['rgba(155, 89, 182, 0.7)', 'rgba(155, 89, 182, 1)'],
        ['rgba(241, 196, 15, 0.7)', 'rgba(241, 196, 15, 1)'],
        ['rgba(231, 76, 60, 0.7)', 'rgba(231, 76, 60, 1)'],
        ['rgba(52, 73, 94, 0.7)', 'rgba(52, 73, 94, 1)'],
        ['rgba(26, 188, 156, 0.7)', 'rgba(26, 188, 156, 1)'],
        ['rgba(230, 126, 34, 0.7)', 'rgba(230, 126, 34, 1)'],
        ['rgba(149, 165, 166, 0.7)', 'rgba(149, 165, 166, 1)'],
        ['rgba(41, 128, 185, 0.7)', 'rgba(41, 128, 185, 1)']
    ];
    
    let colorIndex = 0;
    
    for (const [candidateId, voteCount] of Object.entries(candidateVotes)) {
        labels.push(candidateNames[candidateId]);
        data.push(voteCount);
        
        // Assign colors from the palette, cycling if needed
        const [bgColor, borderColor] = colorPalette[colorIndex % colorPalette.length];
        backgroundColors.push(bgColor);
        borderColors.push(borderColor);
        
        colorIndex++;
    }
    
    // Create the chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `Votes: ${value} (${percentage}%)`;
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