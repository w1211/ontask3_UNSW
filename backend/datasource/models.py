from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument
from mongoengine.fields import (
    StringField,
    DictField,
    ListField,
    IntField,
    ReferenceField,
    EmbeddedDocumentField,
    DateTimeField,
)
from datetime import datetime
import pandas as pd

from container.models import Container

from .utils import (
    retrieve_csv_data,
    retrieve_excel_data,
    retrieve_file_from_s3,
    retrieve_sql_data,
)


class Connection(EmbeddedDocument):
    dbType = StringField(
        choices=(
            "mysql",
            "postgresql",
            "sqlite",
            "mssql",
            "csvTextFile",
            "xlsXlsxFile",
            "s3BucketFile",
        ),
        required=True,
    )
    host = StringField()
    port = IntField()
    database = StringField()
    user = StringField()
    password = StringField()
    query = StringField()
    sheetname = StringField()
    delimiter = StringField()
    bucket = StringField()
    fileName = StringField()


class Schedule(EmbeddedDocument):
    startTime = DateTimeField(null=True)
    endTime = DateTimeField(null=True)
    time = DateTimeField(required=True)
    frequency = StringField(required=True, choices=("daily", "weekly", "monthly"))
    dayFrequency = IntField(min_value=1)  # I.e. every n days
    # List of shorthand day names, e.g. ['mon', 'wed', 'fri']
    dayOfWeek = ListField(StringField())
    # Number representing the date in the month, e.g. 1 is the 1st
    dayOfMonth = DateTimeField()
    taskName = StringField()  # The name of the celery task
    asyncTasks = ListField(StringField())  # Async tasks


class Datasource(Document):
    # Owner of the datasource can be determined from container.owner
    # Cascade delete if container is deleted
    container = ReferenceField(Container, required=True, reverse_delete_rule=2)
    name = StringField(required=True)
    connection = EmbeddedDocumentField(Connection)
    data = ListField(DictField())
    schedule = EmbeddedDocumentField(Schedule, null=True)
    # Last time the data was updated
    lastUpdated = DateTimeField(default=datetime.utcnow)
    fields = ListField(StringField())
    types = DictField()

    def retrieve_data(self, connection=None, file=None):
        if not connection:
            connection = self.connection

        data = []

        if self.connection.dbType in ["mysql", "postgresql", "sqlite", "mssql"]:
            data = retrieve_sql_data(connection)

        elif self.connection.dbType == "s3BucketFile":
            data = retrieve_file_from_s3(connection)

        elif self.connection.dbType == "xlsXlsxFile":
            sheetname = connection.get("sheetname")
            data = retrieve_excel_data(file, sheetname)

        elif self.connection.dbType == "csvTextFile":
            delimiter = connection.get("delimiter")
            data = retrieve_csv_data(file, delimiter)

        # Process the data to correctly parse percentages as numbers
        df = pd.DataFrame(data)
        df = df.applymap(
            lambda x: x.rstrip("%") if isinstance(x, str) and x.endswith("%") else x
        )
        data = df.to_dict("records")
        
        return data

    def refresh_data(self):
        if self.connection.dbType in [
            "s3BucketFile",
            "mysql",
            "postgresql",
            "sqlite",
            "mssql",
        ]:
            self.data = self.retrieve_data()
            self.fields = [field for field in self.data[0]]
            self.lastUpdated = datetime.utcnow
            
            self.save()
