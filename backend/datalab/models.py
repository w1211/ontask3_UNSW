from mongoengine import Document, EmbeddedDocument
from mongoengine.fields import (
    StringField,
    DictField,
    ListField,
    EmbeddedDocumentListField,
    IntField,
    ReferenceField,
    BooleanField,
    EmbeddedDocumentField,
    DateTimeField,
    FloatField,
)

from container.models import Container


class Column(EmbeddedDocument):
    stepIndex = IntField()
    field = StringField()
    visible = BooleanField(default=True)
    pinned = BooleanField(default=False)


class Discrepencies(EmbeddedDocument):
    matching = BooleanField()
    primary = BooleanField()


class DatasourceModule(EmbeddedDocument):
    id = StringField(required=True)
    primary = StringField(required=True)
    matching = StringField(null=True)
    fields = ListField(StringField())
    labels = DictField()
    types = DictField()
    discrepencies = EmbeddedDocumentField(Discrepencies)


class ComputedField(EmbeddedDocument):
    name = StringField(required=True)
    type = StringField(null=True)
    formula = DictField(required=True)


class ComputedModule(EmbeddedDocument):
    fields = EmbeddedDocumentListField(ComputedField)


class Module(EmbeddedDocument):
    type = StringField(choices=("datasource", "computed", "form"), required=True)
    datasource = EmbeddedDocumentField(DatasourceModule)
    form = StringField(null=True)  # a Form model object ID will be passed in
    computed = EmbeddedDocumentField(ComputedModule)


class Chart(EmbeddedDocument):
    chartType = StringField(
        choices=("barChart", "pieChart", "boxPlot", "table"), required=True
    )
    colNameSelected = StringField(required=True)
    interval = FloatField(null=True)
    range = ListField(FloatField(), null=True)
    groupByCol = StringField(null=True)
    numBins = IntField(null=True)
    visibleField = StringField(null=True)
    onSameChart = BooleanField(null=True)
    percentageAxis = BooleanField(null=True)
    selections = ListField(StringField())
    filterCols = ListField(StringField())


class Datalab(Document):
    # Cascade delete if container is deleted
    container = ReferenceField(Container, required=True, reverse_delete_rule=2)
    name = StringField(required=True)
    steps = EmbeddedDocumentListField(Module)
    order = EmbeddedDocumentListField(Column)
    charts = EmbeddedDocumentListField(Chart)
