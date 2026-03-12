describe('Configuration Jest', () => {
  test('devrait additionner correctement', () => {
    expect(1 + 1).toBe(2);
  });

  test('devrait gérer les chaînes', () => {
    const message = 'Hello Jest';
    expect(message).toContain('Jest');
  });
});
