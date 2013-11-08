define(["./helper"], function (nestedHelper) {
  return {
    name: 'bar',
    version: '0.4',
    nestedHelperName: nestedHelper.name
  };
});
