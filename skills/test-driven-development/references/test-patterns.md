# Test Patterns by Language and Framework

## TypeScript / Jest or Vitest
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest' // or jest

describe('UserService', () => {
  let service: UserService
  let mockRepo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockRepo = { findById: vi.fn(), save: vi.fn() }
    service = new UserService(mockRepo as any)
  })

  it('returns user when found', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1', name: 'Alice' })
    const result = await service.getUser('1')
    expect(result).toEqual({ id: '1', name: 'Alice' })
  })

  it('throws NotFoundError when user missing', async () => {
    mockRepo.findById.mockResolvedValue(null)
    await expect(service.getUser('99')).rejects.toThrow(NotFoundError)
  })
})
```

## Python / pytest
```python
import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_repo():
    repo = MagicMock()
    repo.find_by_id.return_value = {"id": "1", "name": "Alice"}
    return repo

def test_get_user_returns_user(mock_repo):
    service = UserService(repo=mock_repo)
    result = service.get_user("1")
    assert result == {"id": "1", "name": "Alice"}

def test_get_user_raises_when_not_found(mock_repo):
    mock_repo.find_by_id.return_value = None
    with pytest.raises(NotFoundError):
        service.get_user("99")
```

## Go / testing
```go
func TestGetUser(t *testing.T) {
    t.Run("returns user when found", func(t *testing.T) {
        repo := &mockRepo{user: &User{ID: "1", Name: "Alice"}}
        svc := NewUserService(repo)
        got, err := svc.GetUser("1")
        if err != nil { t.Fatalf("unexpected error: %v", err) }
        if got.Name != "Alice" { t.Errorf("got %v, want Alice", got.Name) }
    })
}
```
