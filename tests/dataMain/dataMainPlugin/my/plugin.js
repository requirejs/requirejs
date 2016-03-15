define({
    load: function( name, req, onload, config )  {
        requirejs.config({ baseUrl: './modules' });
        req([name], onload);
    }
});
