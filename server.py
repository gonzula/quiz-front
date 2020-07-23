#!/usr/bin/env python3

import os
from uuid import uuid4
import sys

API_URL = 'http://localhost:5000'
FRONT_URL = 'http://localhost:8000'

API_URL = API_URL.encode('ascii')
FRONT_URL = FRONT_URL.encode('ascii')

input_dir = os.path.dirname(__file__)
try:
    output_dir = sys.argv[1]
except IndexError:
    output_dir = f'/tmp/{str(uuid4())}'

try:
    os.mkdir(output_dir)
except FileExistsError:
    pass

for root, dirs, files in os.walk(input_dir):
    if '/.git' in root:
        continue

    for file in files:
        file = os.path.join(root, file)
        if file == __file__:
            continue

        with open(file, 'rb') as fin:
            content = fin.read()

        content = content.replace(b'<##API_URL##>', API_URL)
        content = content.replace(b'<##FRONT_URL##>', FRONT_URL)

        relative_output = file[len(input_dir) + 1:]
        full_output = os.path.join(output_dir, relative_output)

        full_output_dir = os.path.dirname(full_output)
        try:
            os.mkdir(full_output_dir)
        except FileExistsError:
            pass
        with open(full_output, 'wb') as fout:
            fout.write(content)

os.chdir(output_dir)
os.system('python -m http.server')
