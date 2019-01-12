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


class Option(EmbeddedDocument):
    label = StringField(required=True)
    value = StringField(required=True)


class FormField(EmbeddedDocument):
    name = StringField(required=True)
    type = StringField(required=True)
    textDisplay = StringField(null=True)
    textArea = BooleanField(null=True)
    maxLength = IntField(null=True)
    multiSelect = BooleanField(null=True)
    options = EmbeddedDocumentListField(Option)
    listStyle = StringField(null=True)
    alignment = StringField(null=True)
    minimum = IntField(null=True)
    maximum = IntField(null=True)
    precision = IntField(null=True)
    interval = FloatField(null=True)
    numberDisplay = StringField(null=True)
    useIcon = BooleanField(null=True)


class WebForm(EmbeddedDocument):
    permission = StringField()
    visibleFields = ListField(StringField())
    layout = StringField(choices=("vertical", "table"), default="vertical")
    showAll = BooleanField(default=False)
    active = BooleanField(default=False)


class DatasourceModule(EmbeddedDocument):
    id = StringField(required=True)
    primary = StringField(required=True)
    matching = StringField(null=True)
    fields = ListField(StringField())
    labels = DictField()
    types = DictField()
    discrepencies = EmbeddedDocumentField(Discrepencies)


class FormModule(EmbeddedDocument):
    primary = StringField(required=True)
    name = StringField(required=True)
    activeFrom = DateTimeField(null=True)
    activeTo = DateTimeField(null=True)
    fields = EmbeddedDocumentListField(FormField, required=True)
    webForm = EmbeddedDocumentField(WebForm)
    data = ListField(DictField())


class ComputedField(EmbeddedDocument):
    name = StringField(required=True)
    type = StringField(null=True)
    formula = DictField(required=True)


class ComputedModule(EmbeddedDocument):
    fields = EmbeddedDocumentListField(ComputedField)


class Module(EmbeddedDocument):
    type = StringField(choices=("datasource", "computed", "form"), required=True)
    datasource = EmbeddedDocumentField(DatasourceModule)
    form = EmbeddedDocumentField(FormModule)
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
    data = ListField(DictField())
    order = EmbeddedDocumentListField(Column)
    charts = EmbeddedDocumentListField(Chart)
