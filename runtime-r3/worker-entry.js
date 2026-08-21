import { createProductionR3Worker } from './server/index.js';

export default {
  fetch(request, env) {
    return createProductionR3Worker({ env }).fetch(request);
  }
};
