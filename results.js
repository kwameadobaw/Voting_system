document.addEventListener('DOMContentLoaded', function() {
    const positionResultSelect = document.getElementById('positionResultSelect');
    const resultsChart = document.getElementById('resultsChart');
    const totalStudentsElement = document.getElementById('totalStudents');
    const studentsVotedElement = document.getElementById('studentsVoted');
    const participationRateElement = document.getElementById('participationRate');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    let positions = [];
    let chart = null;
    
    // Load positions from localStorage or fetch from JSON
    const storedPositions = JSON.parse(localStorage.getItem('positions'));
    if (storedPositions) {
        positions = storedPositions;
        populatePositionDropdown();
    } else {
        loadPositionsFromJSON();
    }
    
    // Update voting statistics
    updateVotingStats();
    
    // Set up auto-refresh of results
    setInterval(function() {
        updateResults();
        updateVotingStats();
        updateLastUpdated();
    }, 60000); // Update every minute
    
    // Update last updated timestamp
    updateLastUpdated();
    
    // Event listeners
    positionResultSelect.addEventListener('change', displayResults);
    
    function loadPositionsFromJSON() {
        fetch('positions.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch positions data');
                }
                return response.json();
            })
            .then(data => {
                positions = data.positions;
                localStorage.setItem('positions', JSON.stringify(positions));
                populatePositionDropdown();
            })
            .catch(error => {
                console.error('Error:', error);
                document.body.innerHTML += `<div class="error-message">Failed to load positions. Please refresh the page.</div>`;
            });
    }
    
    function populatePositionDropdown() {
        // Clear existing options except the default one
        while (positionResultSelect.options.length > 1) {
            positionResultSelect.remove(1);
        }
        
        // Populate position dropdown
        positions.forEach(position => {
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = position.title;
            positionResultSelect.appendChild(option);
        });
    }
    
    function displayResults() {
        const positionId = positionResultSelect.value;
        
        if (!positionId) {
            if (chart) {
                chart.destroy();
                chart = null;
            }
            return;
        }
        
        const position = positions.find(p => p.id === positionId);
        if (!position) return;
        
        // Get votes from localStorage
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        
        // Filter votes for selected position
        const positionVotes = votes.filter(vote => vote.positionId === positionId);
        
        // Count votes for each candidate
        const candidateVotes = {};
        position.candidates.forEach(candidate => {
            candidateVotes[candidate.id] = 0;
        });
        
        positionVotes.forEach(vote => {
            if (candidateVotes[vote.candidateId] !== undefined) {
                candidateVotes[vote.candidateId]++;
            }
        });
        
        // Prepare data for chart
        const labels = position.candidates.map(candidate => candidate.name);
        const data = position.candidates.map(candidate => candidateVotes[candidate.id]);
        const backgroundColors = [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
        ];
        const borderColors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
        ];
        
        // Create or update chart
        if (chart) {
            chart.destroy();
        }
        
        chart = new Chart(resultsChart, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Votes for ${position.title}`,
                    data: data,
                    backgroundColor: backgroundColors.slice(0, data.length),
                    borderColor: borderColors.slice(0, data.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Voting Results for ${position.title}`,
                        font: {
                            size: 18
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Votes: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Number of Votes'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Candidates'
                        }
                    }
                }
            }
        });
    }
    
    function updateVotingStats() {
        // Get students data
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const totalStudents = students.length;
        const studentsVoted = students.filter(student => student.hasVoted).length;
        const participationRate = totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : 0;
        
        // Update DOM elements
        totalStudentsElement.textContent = totalStudents;
        studentsVotedElement.textContent = studentsVoted;
        participationRateElement.textContent = `${participationRate}%`;
    }
    
    function updateLastUpdated() {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString();
        lastUpdatedElement.textContent = formattedTime;
    }
    
    function updateResults() {
        if (positionResultSelect.value) {
            displayResults();
        }
    }
});