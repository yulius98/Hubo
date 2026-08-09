<?php

it('redirects a cancelled login back to the welcome page', function () {
    $this->get('/authenticate?error=access_denied')
        ->assertRedirect(route('welcome'));
});
