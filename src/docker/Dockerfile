FROM node

# Install Google Chrome to run protractor tests
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
RUN apt-get update && apt-get install -yq google-chrome-stable

RUN mkdir -p /usr/local/musicng \
  && chmod 755 /usr/local/musicng

WORKDIR /usr/local/musicng

ENV PATH /usr/local/musicng/node_modules/.bin:$PATH

RUN npm install -g @angular/cli

# The 0.0.0.0 host listens to all the interfaces from the container
CMD ["ng","serve","--host", "0.0.0.0", "--disable-host-check"]
# ENTRYPOINT ["/usr/bin/tail", "-f", "/dev/null"]
