// src/app/shared/utils/comment.utils.ts

export class CommentUtils {

  /* Flat List to Tree */
  static buildCommentTree(flatComments: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];
    
    // Deep copy để tránh tham chiếu vòng và giữ nguyên dữ liệu gốc nếu cần
    const comments = flatComments.map(c => ({ ...c, children: [] }));

    comments.forEach(c => map.set(c.id, c));

    comments.forEach(c => {
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children.push(c);
        } else {
          // Trường hợp lỗi data (có parentId nhưng không tìm thấy cha), cho làm root tạm
          roots.push(c);
        }
      } else {
        roots.push(c);
      }
    });
    return roots;
  }

  /* Đệ quy tìm node cha và thêm con vào */
  static addReplyToTree(nodes: any[], parentId: number, newChild: any): boolean {
    for (const node of nodes) {
      if (node.id === parentId) {
        if (!node.children) node.children = [];
        node.children.push(newChild);
        return true;
      }
      if (node.children && node.children.length > 0) {
        const found = this.addReplyToTree(node.children, parentId, newChild);
        if (found) return true;
      }
    }
    return false;
  }

  /* Đệ quy tìm và xóa node khỏi cây */
  static removeNodeFromTree(nodes: any[], idToRemove: number): boolean {
    const index = nodes.findIndex(n => n.id === idToRemove);
    if (index !== -1) {
      nodes.splice(index, 1);
      return true;
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const deleted = this.removeNodeFromTree(node.children, idToRemove);
        if (deleted) return true;
      }
    }
    return false;
  }
}