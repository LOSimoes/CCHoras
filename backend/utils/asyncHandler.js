/**
 * Uma função de ordem superior que envolve rotas assíncronas do Express,
 * capturando quaisquer erros e passando-os para o middleware de erro central.
 * @param {Function} fn A função de rota assíncrona.
 * @returns {Function} Uma nova função de rota com tratamento de erro.
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;