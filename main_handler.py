import random
import os
import md5
import urllib
import logging
import re

from google.appengine.ext import db
from google.appengine.ext import blobstore
from google.appengine.ext import webapp
from google.appengine.api import memcache
from google.appengine.api import images

from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import blobstore_handlers


template.register_template_library('translate_tag')

import simplejson as json

from models import *


class AppHandler(webapp.RequestHandler):
    def guess_lang(self):
        os.environ['i18n_lang'] = 'en'

    def render_template(self, name, data = None):
        self.guess_lang()

        path = os.path.join(os.path.dirname(__file__), name)

        if data is None:
            data = {}

        if not data.has_key('admin'):
            data['admin'] = False

        html = template.render(path, data)

        self.response.out.write(html)

        return html


    def render_json(self, data):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(data))


class AdminPage(AppHandler):
    def get(self):
        companies = Company.all().order("__key__").fetch(100)

        self.render_template("index.html", {'companies': companies, 'admin': True})


class MainPage(AppHandler):
    def get(self):
        cache = memcache.get('home_page')

        if cache:
            self.response.out.write(cache)
        else:
            companies = Company.all().order("__key__").fetch(100)
            html = self.render_template("index.html", {'companies': companies})

            memcache.set('home_page', html)


class AddCompany(AppHandler):
    def get(self):
        Company().put()

        self.redirect("/admin")


class AdminUpdate(AppHandler):
    def post(self):
        memcache.delete('home_page')

        language = self.request.get('language')
        messages = json.loads(self.request.get('messages'))
        files = json.loads(self.request.get('files'))

        for key, msg in messages.items():
            key_name = key+language

            msg_db = i18nEntry.get_by_key_name(key_name)

            if msg_db is None:
                msg_db = i18nEntry(key_name = key_name,
                                   msg_id = key,
                                   data = msg,
                                   language = language)
            else:
                msg_db.data = msg

            msg_db.put()


        for key, url in files.items():
            key_name = key

            file_db = FileEntry.get_by_key_name(key_name)

            if file_db is None:
                file_db = FileEntry(key_name = key_name,
                                    url = url)
            else:
                file_db.url = url

            file_db.put()

        self.render_json({'success': 'true'})


class UploadURLsHandler(AppHandler):
    def get(self):
        self.render_json([blobstore.create_upload_url('/upload')])


class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    def post(self):
        upload_files = self.get_uploads()
        self.redirect('/')

class ServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, blob_key):
        blob_key = str(urllib.unquote(blob_key))
        if not blobstore.get(blob_key):
            self.error(404)
        else:
            if self.request.headers.has_key('If-Modified-Since'):
                self.response.headers["Content-Type"] = blobstore.BlobInfo.get(blob_key).content_type
                self.error(304)
            else:
                self.response.headers['Last-Modified'] = "Wed, 26 May 1987 21:21:54 GMT"
                self.response.headers.add_header("Expires", "Thu, 01 Dec 2021 16:00:00 GMT")
                self.response.headers["Cache-Control"] = "max-age=315360000"

                self.send_blob(blobstore.BlobInfo.get(blob_key), save_as=True)


re_image = re.compile('image\/')

class MediaListHandler(AppHandler):
    def get(self):
        json = []

        media_type = self.request.get('type')

        for b in blobstore.BlobInfo.all().order('creation'):
            if media_type == 'image':
                if re_image.match(b.content_type):
                    data = blobstore.fetch_data(b.key(), 0, 50000)
                    image = images.Image(image_data = data)

                    json.append({ 'src': str(b.key()), 'filename': b.filename, 'width': image.width, 'height': image.height})
            else:
                if not re_image.match(b.content_type):
                    json.append({ 'src': str(b.key()), 'filename': b.filename})

        self.render_json(json)


application = webapp.WSGIApplication(
                                     [
                                      ('/', MainPage),
                                      ('/admin', AdminPage),
                                      ('/admin/add_company', AddCompany),
                                      ('/admin/update', AdminUpdate),
                                      ('/admin/upload_url', UploadURLsHandler),
                                      ('/upload', UploadHandler),
                                      ('/media/([^/]+)?', ServeHandler),
                                      ('/admin/list_media', MediaListHandler),
                                     ],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
