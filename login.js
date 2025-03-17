document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const studentIdInput = document.getElementById('studentId');
    const errorMessage = document.getElementById('error-message');

    loginBtn.addEventListener('click', login);
    studentIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    function login() {
        const studentId = studentIdInput.value.trim();
        
        if (!studentId) {
            showError('Please enter your student ID');
            return;
        }

        // Get student data from localStorage
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        if (!students.length) {
            // If no students in localStorage, fetch from JSON file
            fetch('students.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch student data');
                    }
                    return response.json();
                })
                .then(data => {
                    localStorage.setItem('students', JSON.stringify(data.students));
                    processLogin(data.students, studentId);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError('An error occurred. Please try again.');
                });
        } else {
            processLogin(students, studentId);
        }
    }

    function processLogin(students, studentId) {
        const student = students.find(s => s.id === studentId);
        
        if (!student) {
            showError('Invalid student ID');
            return;
        }

        if (student.hasVoted) {
            showError('You have already voted');
            return;
        }

        // Store student info in session storage
        sessionStorage.setItem('currentStudent', JSON.stringify(student));
        
        // Redirect to voting page
        window.location.href = 'voting.html';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
});