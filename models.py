from google.appengine.ext import db
from google.appengine.ext import blobstore

class i18nEntry(db.Model):
    msg_id = db.StringProperty()
    language = db.StringProperty()
    data = db.TextProperty()


class Company(db.Model):
    pass


class FileEntry(db.Model):
    url = db.StringProperty();
