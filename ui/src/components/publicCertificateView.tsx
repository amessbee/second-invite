import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ENDPOINTS } from '../config';
import { Certificate } from '../types';

export const PublicCertificateView: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(
          `${ENDPOINTS.API}/agoric/vstorage/data/published.EdCert.certificates.${certificateId}`,
        );
        const data = await response.json();
        const parsedData = JSON.parse(data.value);
        const cert = JSON.parse(parsedData.values[0]);
        setCertificate(cert);
      } catch (err) {
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!certificate) return <div className="error">Certificate not found</div>;

  return (
    <div className="public-certificate">
      <div className="certificate-container">
        <div className="certificate-header">
          {certificate.instituteLogo && (
            <img 
              src={certificate.instituteLogo} 
              alt="Institute Logo" 
              className="institute-logo"
            />
          )}
          <h1>{certificate.instituteName}</h1>
        </div>

        <div className="certificate-content">
          <h2>Certificate of {certificate.certificateType}</h2>
          
          <p className="certificate-text">
            This is to certify that
          </p>
          
          <h3 className="student-name">{certificate.studentName}</h3>
          
          <p className="certificate-text">
            has successfully completed the course of study in
          </p>
          
          <h3 className="course-name">{certificate.courseName}</h3>
          
          <p className="certificate-text">
            with specialization in {certificate.specialization}
          </p>
          
          <div className="grade-section">
            <p>Grade Achieved: <strong>{certificate.grade}</strong></p>
          </div>

          <div className="date-section">
            <p>From: {new Date(certificate.startDate).toLocaleDateString()}</p>
            <p>To: {new Date(certificate.endDate).toLocaleDateString()}</p>
          </div>

          <div className="achievements-section">
            <h4>Achievements</h4>
            <p>{certificate.achievements}</p>
          </div>

          <div className="signature-section">
            {certificate.authoritySignature && (
              <img 
                src={certificate.authoritySignature} 
                alt="Authority Signature" 
                className="signature"
              />
            )}
            <p className="authority-name">{certificate.certifyingAuthority}</p>
            <p className="authority-title">{certificate.authorityDesignation}</p>
          </div>

          <div className="certificate-footer">
            <p className="certificate-id">Certificate ID: {certificate.certificateId}</p>
            <p className="verification-note">
              This certificate can be verified at {window.location.origin}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these styles
<style>
{`
  .public-certificate {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background: #f5f5f5;
  }

  .certificate-container {
    background: white;
    padding: 3rem;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
    max-width: 800px;
    width: 100%;
    position: relative;
  }

  .certificate-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .institute-logo {
    max-width: 150px;
    margin-bottom: 1rem;
  }

  .certificate-content {
    text-align: center;
  }

  .student-name {
    font-size: 2rem;
    color: #2c3e50;
    margin: 1.5rem 0;
  }

  .course-name {
    font-size: 1.5rem;
    color: #34495e;
    margin: 1rem 0;
  }

  .certificate-text {
    font-size: 1.1rem;
    color: #7f8c8d;
    margin: 0.5rem 0;
  }

  .grade-section {
    margin: 1.5rem 0;
  }

  .achievements-section {
    margin: 2rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 5px;
  }

  .signature-section {
    margin-top: 3rem;
  }

  .signature {
    max-width: 200px;
    margin-bottom: 0.5rem;
  }

  .authority-name {
    font-weight: bold;
    margin-bottom: 0.2rem;
  }

  .authority-title {
    color: #7f8c8d;
  }

  .certificate-footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
    font-size: 0.9rem;
    color: #95a5a6;
  }

  .certificate-id {
    margin-bottom: 0.5rem;
  }

  .verification-note {
    font-style: italic;
  }

  @media print {
    .public-certificate {
      padding: 0;
      background: white;
    }

    .certificate-container {
      box-shadow: none;
      padding: 2rem;
    }
  }
`}
</style>
