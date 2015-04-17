FROM node:0.12.2

ENV VERSION 2.1.1
ENV APP /dockerode

RUN apt-get update -qq && \
    apt-get install -qy \
    wget

RUN wget https://github.com/apocas/dockerode/archive/v$VERSION.tar.gz && \
    tar -xzvf v$VERSION.tar.gz && \
    rm v$VERSION.tar.gz && \
    mv dockerode-$VERSION $APP

WORKDIR $APP

RUN npm install
