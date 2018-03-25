import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from ontask.settings import ONTASK_EMAIL_ADDRESS, ONTASK_EMAIL_PASS, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
from django.core.mail import EmailMessage, get_connection
import boto3
import csv
import io
from xlrd import open_workbook

def send_email(sender_address, recipient_address, email_subject, html_content, reply_to_address=None):
    '''Generic service to send email from the application'''
    try:
        connection = get_connection(host='smtp.office365.com', 
                    port=587, 
                    username=ONTASK_EAMIL_ADDRESS, 
                    password=ONTASK_EMAIL_PASS, 
                    use_tls=True) 

        reply_to_address = reply_to_address if (reply_to_address) else sender_address
        email = EmailMessage(
            email_subject,
            html_content,
            sender_address,
            [recipient_address],
            reply_to=[reply_to_address],
            connection=connection,
        )
        email.send()
    except Exception as exception:
        raise Exception("Error sending email")

def get_s3bucket_file_data(bucket, file_name, delimiter=None, sheetname=None):
    try:
        #connect to account specificed in setting file
        session = boto3.Session(
            aws_access_key_id = AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name='ap-southeast-2'
        )
        #get user's remote file with bucket name and file name
        s3 = session.resource('s3')
        obj = s3.Object(bucket, file_name)
        file = obj.get()['Body']

        #read file content based on file type, return content and field names
        if file_name.lower().endswith(('.csv', '.txt')):
            return get_csv_data(file, delimiter)
        elif file_name.lower().endswith(('.xls', '.xlsx')):
            return get_xls_data(file, sheetname)
        else:
            raise Exception('File type is not supported')
    except:
        raise Exception('Error reading file from s3 bucket')

#get data from csv file with default separator "," or user specified
def get_csv_data(csv_file, separator_char=','):
    reader = csv.DictReader(io.StringIO(csv_file.read().decode('utf-8')), delimiter=separator_char)
    data = list(reader)
    fields = list(data[0].keys())
    return (data, fields)

#get excel data with user specified sheetname
def get_xls_data(xls_file, sheetname):
    book = open_workbook(file_contents=xls_file.read())
    sheet = book.sheet_by_name(sheetname)
    # read header values into the list
    keys = [sheet.cell(0, col_index).value for col_index in range(sheet.ncols)]
    dict_list = []
    for row_index in range(1, sheet.nrows):
        d = {keys[col_index]: sheet.cell(row_index, col_index).value
                for col_index in range(sheet.ncols)}
        dict_list.append(d)
    return (dict_list, keys)

def main():
    # Without Reply to email
    send_email("zLNTLada@ad.unsw.edu.au","rohit.jose@unsw.edu.au","Test","HELLO THERE","<h1>HELLO THERE</h1>")
    # With reply to email
    send_email("zLNTLada@ad.unsw.edu.au","rohit.jose@unsw.edu.au","Test","HELLO THERE","<h1>HELLO THERE</h1>","rohit.jose@unsw.edu.au")

if __name__ == '__main__':
    main()