require.def('Carousel', function () {
    return function Carousel(service) {
        this.service = service;
        this.someType = 'Carousel';
    };
});

require.def('app', ['Carousel'], function () {
    
});
