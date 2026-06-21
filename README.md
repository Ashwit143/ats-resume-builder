# ATS Resume Analyzer

A free ATS (Applicant Tracking System) Resume Analyzer that helps job seekers evaluate how well their resume matches a target role.

Upload your PDF resume, select a job role, and receive an ATS compatibility score based on keyword matching, resume structure detection, and content quality analysis.

## Live Demo

https://ats-resume-builder-7wth.vercel.app/

## Features

### Resume Analysis

* Upload PDF resumes
* Instant ATS score generation
* Role-based analysis

### Supported Roles

* Frontend Developer
* Backend Developer
* Full Stack Developer
* Software Engineer
* Data Analyst

### ATS Scoring System

The ATS score is calculated using three components:

| Component        | Weight |
| ---------------- | ------ |
| Keyword Match    | 60%    |
| Resume Structure | 20%    |
| Content Quality  | 20%    |

### Keyword Analysis

* Detects relevant technical keywords
* Shows matched keywords
* Identifies missing keywords
* Provides role-specific recommendations

### Resume Structure Detection

Checks for important sections:

* Skills
* Experience
* Education
* Projects
* Certifications

### Content Quality Analysis

Evaluates:

* Resume length
* Action verbs usage
* Project descriptions
* Quantified achievements
* Technology mentions

### Additional Features

* Drag-and-drop PDF upload
* Responsive design
* Interactive score visualization
* Detailed improvement suggestions
* Mobile-friendly interface
* No signup required

## Screenshots

### Home Page

<img width="1901" height="1030" alt="Screenshot 2026-06-21 131832" src="https://github.com/user-attachments/assets/ce23ffff-e5aa-4f81-b10c-ad7677de2372" />


### Analysis Results

<img width="1888" height="1030" alt="Screenshot 2026-06-21 131910" src="https://github.com/user-attachments/assets/0239e82f-a637-4f12-99f4-81bf25674a5d" />


## Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Node.js
* Express.js

### Libraries

* pdf-parse
* multer
* cors

### Deployment

* Vercel

## Project Structure

```text
ats-resume-analyzer/
│
├── api/
│   └── analyze.js
│
├── lib/
│   ├── atsScorer.js
│   ├── pdfParser.js
│   └── keywords.js
│
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
│
├── server.js
├── package.json
└── README.md
```


## How It Works

1. User uploads a PDF resume.
2. PDF text is extracted using pdf-parse.
3. Resume content is analyzed against role-specific keyword databases.
4. Resume sections are detected.
5. Content quality is evaluated.
6. ATS score is generated.
7. Improvement suggestions are displayed.

## Validation Rules

### Accepted Files

* PDF only

### File Size Limit

* Maximum 5 MB

### PDF Requirements

* Text-based PDFs supported
* Scanned/image-only PDFs are not supported

## Why I Built This

As a student actively applying for internships, I frequently updated and optimized my resume for different roles. Most ATS analysis tools available online were either paid, required signups, or provided limited feedback.

I built this project to create a simple, free, and accessible tool that helps students and job seekers understand how well their resume aligns with a target role before applying.

## Future Improvements

* Job Description Based Analysis
* Resume Report Download (PDF)
* Resume Comparison Mode
* Custom Keyword Sets
* ATS Optimization Tips
* Dark/Light Theme Toggle

## Author

**Ashwit**

GitHub: https://github.com/Ashwit143

## License

This project is licensed under the MIT License.
