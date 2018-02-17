import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_email(sender_address, recipient_address, email_subject, text_content, html_content):
    '''Generic service to send email from the application'''

    try:

        # Create message container - the correct MIME type is multipart/alternative.
        msg = MIMEMultipart('alternative')
        msg['Subject'] = email_subject
        msg['From'] = sender_address
        msg['To'] = recipient_address

        # Create the body of the message (a plain-text and an HTML version).
        # text = "Hi!\nHow are you?\nHere is the link you wanted:\nhttps://www.python.org"
        # html = """\
        # <html>
        # <head></head>
        # <body>
        #     <p>Hi!<br>
        #     How are you?<br>
        #     Here is the <a href="https://www.python.org">link</a> you wanted.
        #     </p>
        # </body>
        # </html>
        # """

        # Record the MIME types of both parts - text/plain and text/html.
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')

        # Attach parts into message container.
        # According to RFC 2046, the last part of a multipart message, in this case
        # the HTML message, is best and preferred.
        msg.attach(part1)
        msg.attach(part2)

        # Send the message via SMTP server.
        # TO-DO: make the mail server entries a config entry
        s = smtplib.SMTP(host='smtp.office365.com', port=587)
        s.starttls()
        # TO-DO: add the login as a config
        s.login("zLNTLada@ad.unsw.edu.au", "Dataj3f3!")
        # sendmail function takes 3 arguments: sender's address, recipient's address
        # and message to send - here it is sent as one string.
        s.sendmail(sender_address, recipient_address, msg.as_string())
        s.quit()
        print("Email sent successfully")
        return True
    except Exception as exception:
        print("Error sending email")
        print(exception)
        return False

def main():
    send_email("zLNTLada@ad.unsw.edu.au","rohitjose@gmail.com","Test","This is a test email","<h1>This is a test email</h1>","Dataj3f3!")

if __name__ == '__main__':
    main()
