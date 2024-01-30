class Stack:

    def __init__(self):
        self.items = []

    def __len__(self):
        return len(self.items)

    def is_empty(self):
        return self.items == []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        return self.items.pop()

    def peek(self):
        if not self.is_empty():
            return self.items[len(self)-1]
        else:
            return None
