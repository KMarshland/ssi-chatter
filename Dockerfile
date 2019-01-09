FROM lynckia/licode

COPY server /opt/licode/extras/server
COPY licode_config.js /opt/licode/licode_prod_config.js
RUN cp -f /opt/licode/licode_prod_config.js /opt/licode/scripts/licode_default.js
RUN cp -R /opt/licode/extras/server/* /opt/licode/extras/basic_example/