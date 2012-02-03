#!/bin/bash
rsync -avz --exclude nbproject --exclude .git -e  "ssh -p2222" . deploynaut@deploymaster:/sites/deploynaut/www/
