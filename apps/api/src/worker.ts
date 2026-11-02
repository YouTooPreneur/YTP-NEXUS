console.log('worker started');

const timer = setInterval(() => {}, 60_000);

function stop(): void {
  clearInterval(timer);
  process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
