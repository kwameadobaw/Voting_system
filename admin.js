// Add this at the beginning of the admin.js file
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is authenticated
    if (!sessionStorage.getItem('adminAuthenticated')) {
        // Show login prompt
        const password = prompt('Please enter admin password:');
        
        // Simple password check (in a real app, this would be server-side)
        if (password === 'admin123') {
            sessionStorage.setItem('adminAuthenticated', 'true');
        } else {
            alert('Invalid password. Access denied.');
            window.location.href = 'index.html';
            return;
        }
    }
    
    const resetVotesBtn = document.getElementById('resetVotesBtn');
    const resetStudentsBtn = document.getElementById('resetStudentsBtn');
    const downloadDataBtn = document.getElementById('downloadDataBtn');
    const adminMessage = document.getElementById('adminMessage');
    
    const totalStudentsElement = document.getElementById('totalStudents');
    const studentsVotedElement = document.getElementById('studentsVoted');
    const participationRateElement = document.getElementById('participationRate');
    const totalVotesElement = document.getElementById('totalVotes');
    const positionStatsTable = document.getElementById('positionStats');
    
    // Load statistics when page loads
    updateStatistics();
    
    // Set up auto-refresh of statistics
    setInterval(updateStatistics, 60000); // Update every minute
    
    // Event listeners
    resetVotesBtn.addEventListener('click', resetVotes);
    resetStudentsBtn.addEventListener('click', resetStudentStatus);
    downloadDataBtn.addEventListener('click', downloadVotingData);
    
    function updateStatistics() {
        // Get data from localStorage
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        
        // Update general statistics
        const totalStudents = students.length;
        const studentsVoted = students.filter(student => student.hasVoted).length;
        const participationRate = totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : 0;
        const totalVotes = votes.length;
        
        totalStudentsElement.textContent = totalStudents;
        studentsVotedElement.textContent = studentsVoted;
        participationRateElement.textContent = `${participationRate}%`;
        totalVotesElement.textContent = totalVotes;
        
        // Update position statistics
        // Clear existing rows except header
        while (positionStatsTable.rows.length > 1) {
            positionStatsTable.deleteRow(1);
        }
        
        positions.forEach(position => {
            // Filter votes for this position
            const positionVotes = votes.filter(vote => vote.positionId === position.id);
            
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
            
            // Find leading candidate
            let leadingCandidate = { name: 'None', votes: 0 };
            position.candidates.forEach(candidate => {
                if (candidateVotes[candidate.id] > leadingCandidate.votes) {
                    leadingCandidate = {
                        name: candidate.name,
                        votes: candidateVotes[candidate.id]
                    };
                }
            });
            
            // Create table row
            const row = positionStatsTable.insertRow();
            
            const positionCell = row.insertCell(0);
            positionCell.textContent = position.title;
            
            const votesCell = row.insertCell(1);
            votesCell.textContent = positionVotes.length;
            
            const leadingCell = row.insertCell(2);
            leadingCell.textContent = leadingCandidate.votes > 0 ? 
                `${leadingCandidate.name} (${leadingCandidate.votes} votes)` : 
                'No votes yet';
        });
    }
    
    function resetVotes() {
        if (confirm('Are you sure you want to reset all votes? This action cannot be undone.')) {
            localStorage.setItem('votes', JSON.stringify([]));
            updateStatistics();
            showMessage('All votes have been reset successfully.', 'success');
        }
    }
    
    function resetStudentStatus() {
        if (confirm('Are you sure you want to reset all student voting status? This will allow students to vote again.')) {
            const students = JSON.parse(localStorage.getItem('students')) || [];
            
            students.forEach(student => {
                student.hasVoted = false;
            });
            
            localStorage.setItem('students', JSON.stringify(students));
            updateStatistics();
            showMessage('Student voting status has been reset successfully.', 'success');
        }
    }
    
    function downloadVotingData() {
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        
        const data = {
            votes: votes,
            students: students,
            positions: positions,
            exportDate: new Date().toISOString(),
            statistics: {
                totalStudents: students.length,
                studentsVoted: students.filter(student => student.hasVoted).length,
                totalVotes: votes.length
            }
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileName = `voting_data_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showMessage('Voting data has been downloaded.', 'success');
    }
    
    function showMessage(message, type) {
        adminMessage.textContent = message;
        adminMessage.className = `message ${type}`;
        adminMessage.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            adminMessage.style.display = 'none';
        }, 5000);
    }
});