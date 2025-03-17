document.addEventListener('DOMContentLoaded', function() {
    // Initialize database and load results
    window.VotingDB.init().then(() => {
        loadResults();
        
        // Update the last updated time
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
    }).catch(error => {
        console.error('Error initializing database:', error);
        alert('There was an error loading the voting data. Please try again later.');
    });
});

function loadResults() {
    // Use Promise.all to get all the data we need from the database
    Promise.all([
        window.VotingDB.positions.getAll(),
        window.VotingDB.votes.getAll(),
        window.VotingDB.students.getAll()
    ]).then(([positions, votes, students]) => {
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
                    result.classList.remove('active');
                });
                
                // Show the selected position result
                document.getElementById(`position-${position.id}`).classList.add('active');
            });
            
            positionTabs.appendChild(tabButton);
            
            // Create result container for this position
            const resultContainer = document.createElement('div');
            resultContainer.className = `position-result ${index === 0 ? 'active' : ''}`;
            resultContainer.id = `position-${position.id}`;
            
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
    }).catch(error => {
        console.error('Error loading results:', error);
        alert('There was an error loading the voting results. Please try again later.');
    });
}

// The createChart function remains the same