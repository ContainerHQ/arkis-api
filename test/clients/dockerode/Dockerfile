FROM node:0.12.2

ENV VERSION 2.1.2

ENV APP /dockerode

RUN curl -sL https://github.com/apocas/dockerode/archive/v$VERSION.tar.gz -o - | \
    tar xzf - -C . && \
    mv dockerode-$VERSION $APP

WORKDIR $APP

RUN npm install

CMD npm test
