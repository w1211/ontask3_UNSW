from mongoengine import Document, EmbeddedDocument, DynamicEmbeddedDocument
from mongoengine.fields import (
    StringField,
    DictField,
    ListField,
    IntField,
    ReferenceField,
    EmbeddedDocumentField,
    EmbeddedDocumentListField,
    DateTimeField,
)
from datetime import datetime as dt
import pandas as pd

from container.models import Container

from .utils import (
    retrieve_csv_data,
    retrieve_excel_data,
    retrieve_file_from_s3,
    retrieve_sql_data,
    process_data,
)

class File(EmbeddedDocument):
    name = StringField()
    delimiter = StringField()
    sheetname = StringField()


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
    bucket = StringField()
    files = EmbeddedDocumentListField(File)


class Schedule(EmbeddedDocument):
    active_from = DateTimeField(null=True)
    active_to = DateTimeField(null=True)
    time = DateTimeField(required=True)
    frequency = StringField(required=True, choices=("daily", "weekly", "monthly"))
    # List of shorthand day names, e.g. ['mon', 'wed', 'fri']
    day_of_week = ListField(StringField())
    # Number representing the date in the month, e.g. 1 is the 1st
    day_of_month = DateTimeField()
    task_name = StringField()  # The name of the celery task


class Datasource(Document):
    # Owner of the datasource can be determined from container.owner
    # Cascade delete if container is deleted
    container = ReferenceField(Container, required=True, reverse_delete_rule=2)
    name = StringField(required=True)
    connection = EmbeddedDocumentField(Connection)
    data = ListField(DictField())
    schedule = EmbeddedDocumentField(Schedule, null=True)
    # Last time the data was updated
    lastUpdated = DateTimeField(default=dt.utcnow)
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
            sheetname = connection["files"][0]["sheetname"]
            data = retrieve_excel_data(file, sheetname)

        elif self.connection.dbType == "csvTextFile":
            delimiter = connection["files"][0]["delimiter"]
            data = retrieve_csv_data(file, delimiter)

        data = process_data(data)
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
            self.lastUpdated = dt.utcnow()

            self.save()
            self.update_associated_datalabs()

    def update_associated_datalabs(self):
        from datalab.models import Datalab
        from datalab.utils import get_relations
        from form.models import Form

        # Find any datalabs that use this datasource and update their relations table
        # But only if any of the datasource's fields actually appears in the relations table
        for datalab in Datalab.objects.filter(steps__datasource__id=str(self.id)):
            relations = pd.DataFrame(datalab.relations)
            if any([field in relations for field in self.fields]):
                datalab.relations = get_relations(
                    datalab.steps, datalab.id, permission=datalab.permission
                )
                datalab.save()
                datalab.refresh_access()

                # Find any other datalabs that use this datalab and update their relations table
                for other_datalab in Datalab.objects.filter(
                    steps__datasource__id=str(datalab.id)
                ):
                    other_datalab.relations = get_relations(
                        other_datalab.steps,
                        other_datalab.id,
                        permission=other_datalab.permission,
                    )
                    other_datalab.save()
                    other_datalab.refresh_access()

                    # Find any forms that use the other datalab and update their permissions values
                    for form in Form.objects.filter(datalab=other_datalab):
                        form.refresh_access()

                # Find any forms that use this datalab and update their permissions values
                for form in Form.objects.filter(datalab=datalab):
                    form.refresh_access()
