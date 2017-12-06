import psycopg2
import names
from random import randint

PASSWORD = 'ontask'

try:
  connection = psycopg2.connect(
    host = 'localhost',
    dbname = 'ontask_seed',
    user = 'ontask',
    password = 'ontask'
  )
  cursor = connection.cursor()

  # Create table of students
  cursor.execute('DROP TABLE IF EXISTS students;')
  cursor.execute('CREATE TABLE students (id serial PRIMARY KEY, first_name text, last_name text, email text);')

  # Create table of student grades
  cursor.execute('DROP TABLE IF EXISTS grades;')
  cursor.execute('CREATE TABLE grades (id serial PRIMARY KEY, student_id text, grade integer);')

  # Insert students and grades
  users = []
  grades = []

  for i in range(20):
    firstName = names.get_first_name()
    lastName = names.get_last_name()
    user = { 
      "firstName": firstName, 
      "lastName": lastName, 
      "email": '{0}.{1}@email.com'.format(firstName, lastName)
    }
    users.append(user)

    grade = {
      "studentId": i + 1, # postgreSQL serials start from 1
      "grade": randint(1, 100)
    }
    grades.append(grade)

  cursor.executemany('INSERT INTO students(first_name, last_name, email) VALUES (%(firstName)s, %(lastName)s, %(email)s)', users)
  cursor.executemany('INSERT INTO grades(student_id, grade) VALUES (%(studentId)s, %(grade)s)', grades)

except (Exception, psycopg2.DatabaseError) as error:
  print(error)
finally:
  if connection is not None:
    cursor.close()
    connection.commit()
    connection.close()