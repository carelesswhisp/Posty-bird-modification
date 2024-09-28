import axios from '../utils/http';
import { PostyBirbNotification } from 'postybirb-commons';

export default class NotificationService {
  static remove(id: string) {
    return axios.delete(`/notification/${id}`);
  }

  static removeAll() {
    return axios.delete('notification/all');
  }

  static getAll() {
    return axios.get<PostyBirbNotification[]>('/notification/all').then(({ data }) => data);
  }

  static markAsViewed(ids: string[]) {
    return axios.patch('notification/seen', { ids });
  }
}
