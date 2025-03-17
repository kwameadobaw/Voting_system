document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is authenticated
    if (!sessionStorage.getItem('adminAuthenticated')) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const totalStudentsElement = document.getElementById('totalStudents');
    const studentsVotedElement = document.getElementById('studentsVoted');
    const participationRateElement = document.getElementById('participationRate');
    const totalVotesElement = document.getElementById('totalVotes');
    const positionStatsTable = document.getElementById('positionStatsTable').querySelector('tbody');
    const positionsContainer = document.getElementById('positionsContainer');
    const studentsContainer = document.getElementById('studentsContainer');
    const adminMessage = document.getElementById('adminMessage');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Action buttons
    const resetVotesBtn = document.getElementById('resetVotesBtn');
    const resetStudentStatusBtn = document.getElementById('resetStudentStatusBtn');
    const downloadDataBtn = document.getElementById('downloadDataBtn');

    resetVotesBtn.addEventListener('click', resetVotes);
    resetStudentStatusBtn.addEventListener('click', resetStudentStatus);
    downloadDataBtn.addEventListener('click', downloadData);

    // Load data
    loadData();
    updateLastUpdated();

    // Set interval to refresh data every 30 seconds
    setInterval(loadData, 30000);
    setInterval(updateLastUpdated, 30000);

    function loadData() {
        loadStudents();
        loadPositions();
        loadVotes();
        updateStats();
    }

    function loadStudents() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        // Update student stats
        const totalStudents = students.length;
        const studentsVoted = students.filter(student => student.hasVoted).length;
        const participationRate = totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : '0.0';
        
        totalStudentsElement.textContent = totalStudents;
        studentsVotedElement.textContent = studentsVoted;
        participationRateElement.textContent = `${participationRate}%`;
        
        // Display students in the students tab
        studentsContainer.innerHTML = '';
        
        if (students.length === 0) {
            studentsContainer.innerHTML = '<p>No students found.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.hasVoted ? '<span style="color: #2ecc71;">Voted</span>' : '<span style="color: #e74c3c;">Not Voted</span>'}</td>
            `;
            tbody.appendChild(row);
        });
        
        studentsContainer.appendChild(table);
    }

    function loadPositions() {
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        
        // Display positions in the positions tab
        positionsContainer.innerHTML = '';
        
        if (positions.length === 0) {
            positionsContainer.innerHTML = '<p>No positions found.</p>';
            return;
        }
        
        positions.forEach(position => {
            const positionCard = document.createElement('div');
            positionCard.className = 'position-card';
            
            let candidatesHTML = '';
            position.candidates.forEach(candidate => {
                candidatesHTML += `
                    <li>${candidate.name} - ${candidate.description}</li>
                `;
            });
            
            positionCard.innerHTML = `
                <h3>${position.title}</h3>
                <p><strong>Candidates:</strong></p>
                <ul>${candidatesHTML}</ul>
            `;
            
            positionsContainer.appendChild(positionCard);
        });
    }

    function loadVotes() {
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        
        // Update total votes count
        totalVotesElement.textContent = votes.length;
        
        // Clear position stats table
        positionStatsTable.innerHTML = '';
        
        if (positions.length === 0 || votes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">No voting data available.</td>';
            positionStatsTable.appendChild(row);
            return;
        }
        
        // Calculate votes per position and leading candidates
        positions.forEach(position => {
            const positionVotes = votes.filter(vote => vote.positionId === position.id);
            
            if (positionVotes.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${position.title}</td>
                    <td>0</td>
                    <td>No votes yet</td>
                `;
                positionStatsTable.appendChild(row);
                return;
            }
            
            // Count votes per candidate
            const candidateVotes = {};
            position.candidates.forEach(candidate => {
                candidateVotes[candidate.id] = 0;
            });
            
            positionVotes.forEach(vote => {
                if (candidateVotes[vote.candidateId] !== undefined) {
                    candidateVotes[vote.candidateId]++;
                }
            });
            
            // Find leading candidate
            let leadingCandidateId = null;
            let maxVotes = 0;
            
            for (const [candidateId, voteCount] of Object.entries(candidateVotes)) {
                if (voteCount > maxVotes) {
                    maxVotes = voteCount;
                    leadingCandidateId = candidateId;
                }
            }
            
            // Get leading candidate name
            let leadingCandidateName = 'Unknown';
            if (leadingCandidateId) {
                const candidate = position.candidates.find(c => c.id === leadingCandidateId);
                if (candidate) {
                    leadingCandidateName = candidate.name;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${position.title}</td>
                <td>${positionVotes.length}</td>
                <td>${leadingCandidateName} (${maxVotes} votes)</td>
            `;
            positionStatsTable.appendChild(row);
        });
    }

    function updateStats() {
        // This function can be expanded to include more statistics
        // Currently, the basic stats are handled in loadStudents and loadVotes
    }

    function resetVotes() {
        if (confirm('Are you sure you want to reset all votes? This action cannot be undone.')) {
            localStorage.setItem('votes', JSON.stringify([]));
            
            // Reset student voting status
            const students = JSON.parse(localStorage.getItem('students')) || [];
            students.forEach(student => {
                student.hasVoted = false;
            });
            localStorage.setItem('students', JSON.stringify(students));
            
            showMessage('All votes have been reset successfully.', 'success');
            loadData();
        }
    }

    function resetStudentStatus() {
        if (confirm('Are you sure you want to reset student voting status? This will allow students to vote again.')) {
            const students = JSON.parse(localStorage.getItem('students')) || [];
            students.forEach(student => {
                student.hasVoted = false;
            });
            localStorage.setItem('students', JSON.stringify(students));
            
            showMessage('Student voting status has been reset successfully.', 'success');
            loadData();
        }
    }

    function downloadData() {
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        const data = {
            votes: votes,
            positions: positions,
            students: students,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileName = `voting_data_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showMessage('Data has been downloaded successfully.', 'success');
    }

    function updateLastUpdated() {
        const now = new Date();
        lastUpdatedElement.textContent = now.toLocaleString();
    }

    function showMessage(message, type) {
        adminMessage.textContent = message;
        adminMessage.className = `message ${type}`;
        adminMessage.style.display = 'block';
        
        setTimeout(() => {
            adminMessage.style.display = 'none';
        }, 5000);
    }
});