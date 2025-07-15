from flask import Flask, render_template, request, jsonify, send_file
import base64
import io
from PIL import Image # For image manipulation on backend
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

app = Flask(__name__)

# Dummy journal rules for local testing without actual API call
JOURNAL_RULES = {
    "Cell": {
        "singleColumnWidth_mm": 85,
        "doubleColumnWidth_mm": 175,
        "maxHeight_mm": 225,
        "dpi_halftone": 300,
        "font_min_pt": 6
    },
    "Nature": {
        "singleColumnWidth_mm": 89,
        "doubleColumnWidth_mm": 183,
        "maxHeight_mm": 247,
        "dpi_halftone": 300,
        "font_min_pt": 7
    },
    "Science": {
        "singleColumnWidth_mm": 55,
        "doubleColumnWidth_mm": 120,
        "maxHeight_mm": 230,
        "dpi_halftone": 300,
        "font_min_pt": 5
    },
    "Default": {
        "singleColumnWidth_mm": 90,
        "doubleColumnWidth_mm": 180,
        "maxHeight_mm": 240,
        "dpi_halftone": 300,
        "font_min_pt": 7
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/faq') # NEW ROUTE FOR FAQ PAGE
def faq():
    return render_template('faq.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/contact')
def contact():
    contact_info = {
        'lab_name': 'Pharmaco-Omics Lab – Omics for Personalized Medicine',
        'description': 'The Pharmaco-Omics Lab leverages cutting-edge laboratory, clinical, and computational approaches to understand the molecular mechanisms of human metabolic diseases (in the broad sense), discover clinically relevant biomarkers, and develop personalized treatment strategies.',
        'main_contributor': 'Nguyen Thien Luan',
        'main_contributor_email': 'ntluan1991@gmail.com',
        'contributors': 'Nguyen Quang Thu, <to be updated>',
        'principal_investigator': 'Nguyen Phuoc Long, M.D., Ph.D.',
        'pi_email': 'pharmacoomicslab<at>gmail<dot>com'
    }
    return render_template('contact.html', contact=contact_info)

@app.route('/api/journal-rules')
def get_journal_rules():
    return jsonify(JOURNAL_RULES)

@app.route('/api/export-<format>', methods=['POST'])
def export_figure(format):
    data = request.get_json()
    canvas_data_url = data['canvasDataUrl']
    dpi = data.get('dpi', 600) # Default to 600 DPI

    try:
        # Decode the base64 image data
        header, encoded = canvas_data_url.split(',', 1)
        image_data = base64.b64decode(encoded)
        image_stream = io.BytesIO(image_data)

        img = Image.open(image_stream)

        # Calculate new dimensions for desired DPI (assuming the input canvas is at 96 DPI)
        # We want to scale the image so that its pixels represent the target DPI.
        # Original size of the image from canvas (in pixels)
        original_width_px = img.width
        original_height_px = img.height

        # Calculate target dimensions in pixels based on desired DPI
        # target_width_px = (original_width_px / 96) * dpi
        # target_height_px = (original_height_px / 96) * dpi

        # Resample the image to the target DPI without changing its pixel dimensions,
        # but embedding the correct DPI in the metadata.
        # If the input canvas is already the high-res canvas, we just save it with correct DPI.
        # For simplicity, we'll assume the canvasDataUrl *is* the high-res image already.
        # If it wasn't, you would resize it here:
        # img = img.resize((int(target_width_px), int(target_height_px)), Image.Resampling.LANCZOS)

        output_buffer = io.BytesIO()

        if format == 'tiff':
            # TIFF needs specific saving options
            img.save(output_buffer, format='TIFF', dpi=(dpi, dpi), compression='tiff_lzw')
        elif format == 'pdf':
            # PDF saving in Pillow usually embeds at screen DPI by default,
            # but you can specify a resolution for raster images within the PDF if img is mode RGB
            # Pillow's PDF saving doesn't directly support a 'dpi' parameter like TIFF.
            # The resolution is usually tied to the pixels per inch of the image itself.
            # If the input canvas image is already scaled to the target DPI, this will work.
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            img.save(output_buffer, format='PDF', resolution=dpi) # resolution hint for PDF
        else: # PNG, JPEG
            img.save(output_buffer, format=format.upper(), dpi=(dpi, dpi))

        output_buffer.seek(0)
        return send_file(output_buffer, mimetype=f'image/{format}', as_attachment=True, download_name=f'figure.{format}')

    except Exception as e:
        app.logger.error(f"Error exporting {format}: {e}")
        return jsonify({'error': 'Export failed', 'details': str(e)}), 500

@app.route('/api/submit-feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        rating = data.get('rating')
        feedback_text = data.get('feedback', '')
        timestamp = data.get('timestamp')
        user_agent = data.get('userAgent', '')

        # Format the email content
        rating_emoji = ['', '😞', '😐', '🙂', '😊', '😍']
        rating_text = ['', 'Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']

        subject = f"EasyFigAssembler User Feedback - {rating_text[rating] if rating else 'No Rating'}"

        body = f"""
New feedback received from EasyFigAssembler:

Rating: {rating_emoji[rating] if rating else 'No rating provided'} ({rating_text[rating] if rating else 'No rating'})

Feedback:
{feedback_text if feedback_text else 'No feedback text provided'}

Technical Details:
- Timestamp: {timestamp}
- User Agent: {user_agent}

---
This feedback was automatically sent from EasyFigAssembler.
        """

        # Log the feedback (for debugging and backup)
        app.logger.info(f"Feedback received - Rating: {rating}, Text: {feedback_text[:100]}...")

        # In a production environment, you would set up proper email sending
        # For now, we'll just log it and return success
        # You can later integrate with services like SendGrid, AWS SES, etc.

        # Simulated email sending (replace with actual email service)
        print(f"EMAIL TO: pharmacoomicslab@gmail.com")
        print(f"SUBJECT: {subject}")
        print(f"BODY: {body}")

        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})

    except Exception as e:
        app.logger.error(f"Error submitting feedback: {e}")
        return jsonify({'error': 'Failed to submit feedback', 'details': str(e)}), 500

if __name__ == '__main__':
    # Ensure a 'static' directory exists for serving static files
    if not os.path.exists('static'):
        os.makedirs('static')
    app.run(debug=True, host='0.0.0.0', port=5000)