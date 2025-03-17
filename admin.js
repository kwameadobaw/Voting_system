document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is authenticated
    if (!sessionStorage.getItem('adminAuthenticated')) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const totalVotesElement = document.getElementById('totalVotes');
    const totalPositionsElement = document.getElementById('totalPositions');
    const totalStudentsElement = document.getElementById('totalStudents');
    const participationRateElement = document.getElementById('participationRate');
    const positionStatsTable = document.getElementById('positionStatsTable');
    const positionsContainer = document.getElementById('positionsContainer');
    const studentsContainer = document.getElementById('studentsContainer');
    const adminMessageDiv = document.getElementById('adminMessage');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.style.display = 'none');
            
            // Show the corresponding tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).style.display = 'block';
        });
    });
    
    // Show default tab (statistics)
    document.querySelector('.tab-btn[data-tab="statistics-tab"]').click();
    
    // Load data
    loadStatistics();
    loadPositions();
    loadStudents();
    updateLastUpdated();
    
    // Set interval to refresh data every 30 seconds
    setInterval(loadStatistics, 30000);
    setInterval(loadPositions, 30000);
    setInterval(loadStudents, 30000);
    setInterval(updateLastUpdated, 30000);
    
    // Add event listeners for control buttons
    document.getElementById('resetVotesBtn').addEventListener('click', resetVotes);
    document.getElementById('resetStudentStatusBtn').addEventListener('click', resetStudentStatus);
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdfReport);
    document.getElementById('downloadCsvBtn').addEventListener('click', downloadCsvReport);

    // Add position form
    const addPositionForm = document.getElementById('addPositionForm');
    if (addPositionForm) {
        addPositionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addPosition();
        });
    }
    
    // Add candidate form
    const addCandidateForm = document.getElementById('addCandidateForm');
    if (addCandidateForm) {
        addCandidateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addCandidate();
        });
    }
    
    // Add student form
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addStudent();
        });
    }
    
    function loadStatistics() {
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        // Update summary stats
        totalVotesElement.textContent = votes.length;
        totalPositionsElement.textContent = positions.length;
        totalStudentsElement.textContent = students.length;
        
        const studentsVoted = students.filter(student => student.hasVoted).length;
        const participationRate = students.length > 0 ? 
            ((studentsVoted / students.length) * 100).toFixed(1) : '0.0';
        participationRateElement.textContent = `${participationRate}%`;
        
        // Clear position stats table
        positionStatsTable.innerHTML = '';
        
        // Add table headers
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Position</th>
            <th>Votes</th>
            <th>Leading Candidate</th>
        `;
        positionStatsTable.appendChild(headerRow);
        
        if (positions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">No positions available.</td>';
            positionStatsTable.appendChild(row);
            return;
        }
        
        // Calculate votes per position and leading candidates
        positions.forEach(position => {
            const positionVotes = votes.filter(vote => vote.positionId === position.id);
            
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
            let leadingCandidateName = 'No votes yet';
            if (leadingCandidateId && maxVotes > 0) {
                const candidate = position.candidates.find(c => c.id === leadingCandidateId);
                if (candidate) {
                    leadingCandidateName = `${candidate.name} (${maxVotes} votes)`;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${position.title}</td>
                <td>${positionVotes.length}</td>
                <td>${leadingCandidateName}</td>
            `;
            positionStatsTable.appendChild(row);
        });
    }
    
    function loadPositions() {
        const positions = JSON.parse(localStorage.getItem('positions')) || [];
        
        // Display positions in the positions tab
        positionsContainer.innerHTML = '';
        
        if (positions.length === 0) {
            positionsContainer.innerHTML = '<p>No positions found.</p>';
            return;
        }
        
        // Create a heading for the positions section
        const heading = document.createElement('h3');
        heading.textContent = 'Available Positions';
        heading.style.marginBottom = '15px';
        positionsContainer.appendChild(heading);
        
        // Create positions grid
        const positionsGrid = document.createElement('div');
        positionsGrid.className = 'positions-grid';
        
        positions.forEach(position => {
            const positionCard = document.createElement('div');
            positionCard.className = 'position-card';
            
            let candidatesHTML = '<ul style="list-style-type: none; padding-left: 0;">';
            if (position.candidates.length === 0) {
                candidatesHTML += '<li>No candidates available</li>';
            } else {
                position.candidates.forEach(candidate => {
                    // Remove the delete button from each candidate
                    candidatesHTML += `
                        <li style="padding: 8px 0; border-bottom: 1px solid #f1f3f5;">
                            <i class="fas fa-user-tie" style="color: #3498db; margin-right: 10px;"></i>
                            ${candidate.name} - ${candidate.description}
                        </li>
                    `;
                });
            }
            candidatesHTML += '</ul>';
            
            positionCard.innerHTML = `
                <h3 style="color: #2c3e50; display: flex; align-items: center;">
                    <i class="fas fa-award" style="color: #3498db; margin-right: 10px;"></i>
                    ${position.title}
                </h3>
                <p><strong>Number of Candidates:</strong> ${position.candidates.length}</p>
                <div style="margin-top: 15px;">
                    <h4 style="color: #7f8c8d; font-size: 16px; margin-bottom: 10px;">Candidates:</h4>
                    ${candidatesHTML}
                </div>
            `;
            
            positionsGrid.appendChild(positionCard);
        });
        
        positionsContainer.appendChild(positionsGrid);
        
        // Add summary of positions
        const totalCandidates = positions.reduce((sum, position) => sum + position.candidates.length, 0);
        
        const summary = document.createElement('div');
        summary.className = 'positions-summary';
        
        summary.innerHTML = `
            <p><strong>Total Positions:</strong> ${positions.length}</p>
            <p><strong>Total Candidates:</strong> ${totalCandidates}</p>
            <p><strong>Average Candidates per Position:</strong> ${(totalCandidates / positions.length).toFixed(1)}</p>
        `;
        
        positionsContainer.appendChild(summary);
    }
    
    function loadStudents() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        // Clear students container
        studentsContainer.innerHTML = '';
        
        if (students.length === 0) {
            studentsContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No students available. Add a student using the form below.</p>
                </div>
            `;
            return;
        }
        
        // Create students table
        const table = document.createElement('table');
        table.className = 'students-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Voted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Add rows for each student
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>
                    <span class="status-badge ${student.hasVoted ? 'voted' : 'not-voted'}">
                        ${student.hasVoted ? 'Yes' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn-small btn-danger remove-student-btn" data-id="${student.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        studentsContainer.appendChild(table);
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-student-btn').forEach(button => {
            button.addEventListener('click', function() {
                const studentId = this.getAttribute('data-id');
                removeStudent(studentId);
            });
        });
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
        adminMessageDiv.textContent = message;
        adminMessageDiv.className = `message ${type}`;
        adminMessageDiv.style.display = 'block';
        
        // Hide message after 3 seconds
        setTimeout(() => {
            adminMessageDiv.style.display = 'none';
        }, 3000);
    }
});

// Add event listeners for the new buttons
document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdfReport);
document.getElementById('downloadCsvBtn').addEventListener('click', downloadCsvReport);

// Remove the old download data button event listener if it exists
const downloadDataBtn = document.getElementById('downloadDataBtn');
if (downloadDataBtn) {
    downloadDataBtn.removeEventListener('click', downloadData);
    downloadDataBtn.style.display = 'none'; // Hide the old button
}

// Function to download PDF report
function downloadPdfReport() {
    const votes = JSON.parse(localStorage.getItem('votes')) || [];
    const positions = JSON.parse(localStorage.getItem('positions')) || [];
    
    if (votes.length === 0) {
        showMessage('No voting data available to generate report.', 'error');
        return;
    }
    
    // Create PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set title
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 243);
    doc.text('Student Voting System - Results Report', 105, 15, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
    
    let yPos = 30;
    
    // Process each position
    positions.forEach(position => {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        const positionVotes = votes.filter(vote => vote.positionId === position.id);
        
        // Add position title
        doc.setFontSize(14);
        doc.setTextColor(52, 73, 94);
        doc.text(`Position: ${position.title}`, 14, yPos);
        yPos += 8;
        
        if (positionVotes.length === 0) {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('No votes cast for this position.', 14, yPos);
            yPos += 10;
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
        
        // Sort candidates by votes (descending)
        const sortedCandidates = Object.entries(candidateVotes)
            .sort((a, b) => b[1] - a[1]);
        
        // Create table headers
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPos, 182, 7, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text('Candidate', 16, yPos + 5);
        doc.text('Votes', 120, yPos + 5);
        doc.text('Percentage', 150, yPos + 5);
        yPos += 10;
        
        // Add rows for each candidate
        sortedCandidates.forEach(([candidateId, voteCount], index) => {
            const percentage = positionVotes.length > 0 ? 
                ((voteCount / positionVotes.length) * 100).toFixed(1) : '0.0';
            
            // Alternate row background
            if (index % 2 === 0) {
                doc.setFillColor(248, 248, 248);
                doc.rect(14, yPos - 5, 182, 7, 'F');
            }
            
            doc.setTextColor(50, 50, 50);
            doc.text(candidateNames[candidateId], 16, yPos);
            doc.text(voteCount.toString(), 120, yPos);
            doc.text(`${percentage}%`, 150, yPos);
            
            yPos += 7;
        });
        
        yPos += 10;
    });
    
    // Add summary
    if (yPos > 230) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(52, 73, 94);
    doc.text('Summary', 14, yPos);
    yPos += 10;
    
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const totalStudents = students.length;
    const studentsVoted = students.filter(student => student.hasVoted).length;
    const participationRate = totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : '0.0';
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Students: ${totalStudents}`, 14, yPos);
    yPos += 7;
    doc.text(`Students Voted: ${studentsVoted}`, 14, yPos);
    yPos += 7;
    doc.text(`Participation Rate: ${participationRate}%`, 14, yPos);
    yPos += 7;
    doc.text(`Total Votes Cast: ${votes.length}`, 14, yPos);
    
    // Save the PDF
    doc.save(`voting_results_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    
    showMessage('PDF report downloaded successfully.', 'success');
}

// Function to download CSV report
function downloadCsvReport() {
    const votes = JSON.parse(localStorage.getItem('votes')) || [];
    const positions = JSON.parse(localStorage.getItem('positions')) || [];
    
    if (votes.length === 0) {
        showMessage('No voting data available to generate report.', 'error');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Position,Candidate,Votes,Percentage\n';
    
    // Process each position
    positions.forEach(position => {
        const positionVotes = votes.filter(vote => vote.positionId === position.id);
        
        if (positionVotes.length === 0) return;
        
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
        
        // Sort candidates by votes (descending)
        const sortedCandidates = Object.entries(candidateVotes)
            .sort((a, b) => b[1] - a[1]);
        
        // Add rows for each candidate
        sortedCandidates.forEach(([candidateId, voteCount]) => {
            const percentage = positionVotes.length > 0 ? 
                ((voteCount / positionVotes.length) * 100).toFixed(1) : '0.0';
            
            // Escape any commas in the text fields
            const escapedPositionTitle = position.title.replace(/,/g, ' ');
            const escapedCandidateName = candidateNames[candidateId].replace(/,/g, ' ');
            
            csvContent += `"${escapedPositionTitle}","${escapedCandidateName}",${voteCount},${percentage}%\n`;
        });
        
        // Add an empty line between positions
        csvContent += '\n';
    });
    
    // Add summary section
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const totalStudents = students.length;
    const studentsVoted = students.filter(student => student.hasVoted).length;
    const participationRate = totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : '0.0';
    
    csvContent += '\nSummary\n';
    csvContent += `Total Students,${totalStudents}\n`;
    csvContent += `Students Voted,${studentsVoted}\n`;
    csvContent += `Participation Rate,${participationRate}%\n`;
    csvContent += `Total Votes Cast,${votes.length}\n`;
    csvContent += `Report Generated,${new Date().toLocaleString()}\n`;
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger the download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `voting_results_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('CSV report downloaded successfully.', 'success');
}
