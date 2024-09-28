import axios from '../utils/http';
import { DescriptionTemplate } from 'postybirb-commons';

export default class DescriptionTemplateService {
  static getAll() {
    return axios.get<DescriptionTemplate[]>('/description-template');
  }

  static remove(id: string) {
    return axios.delete(`/description-template/${id}`);
  }

  static update(template: Partial<DescriptionTemplate>) {
    return axios.patch('/description-template/update', template);
  }

  static create(template: Partial<DescriptionTemplate>) {
    return axios.post<DescriptionTemplate>('/description-template/create', template);
  }
}
