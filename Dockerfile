FROM lynckia/licode

COPY server /opt/licode/extras/server
RUN cp -R /opt/licode/extras/server/* /opt/licode/extras/basic_example/